// tests/unit/getInfo.test.js

const request = require('supertest');
const app = require('../../src/app');

describe('GET /v1/fragments/:id/info', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () => 
    request(app).get('/v1/fragments/123/info').expect(401));

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app).get('/v1/fragments/123/info').auth('invalid@email.com', 'incorrect_password').expect(401));

  // Test getting info for a fragment that doesn't exist
  test('returns 404 for non-existent fragment', async () => {
    const res = await request(app)
      .get('/v1/fragments/non-existent-id/info')
      .auth('user1@email.com', 'password1');
    
    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.code).toBe(404);
    expect(res.body.error.message).toBe('Fragment not found');
  });

  // Test getting info for a text/plain fragment
  test('returns fragment info for text/plain fragment', async () => {
    const fragmentData = 'This is a test fragment for info';
    
    // Create a fragment first
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(fragmentData);

    expect(postRes.statusCode).toBe(201);
    const fragment = postRes.body.fragment;

    // Get fragment info
    const getRes = await request(app)
      .get(`/v1/fragments/${fragment.id}/info`)
      .auth('user1@email.com', 'password1');

    expect(getRes.statusCode).toBe(200);
    expect(getRes.body.status).toBe('ok');
    expect(getRes.body.fragment).toEqual({
      id: fragment.id,
      ownerId: fragment.ownerId,
      created: fragment.created,
      updated: fragment.updated,
      type: 'text/plain',
      size: fragmentData.length
    });
  });

  // Test getting info for a JSON fragment
  test('returns fragment info for application/json fragment', async () => {
    const jsonData = { message: 'Hello', count: 123 };
    const jsonString = JSON.stringify(jsonData);
    
    // Create a JSON fragment
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/json')
      .send(jsonString);

    expect(postRes.statusCode).toBe(201);
    const fragment = postRes.body.fragment;

    // Get fragment info
    const getRes = await request(app)
      .get(`/v1/fragments/${fragment.id}/info`)
      .auth('user1@email.com', 'password1');

    expect(getRes.statusCode).toBe(200);
    expect(getRes.body.status).toBe('ok');
    expect(getRes.body.fragment).toEqual({
      id: fragment.id,
      ownerId: fragment.ownerId,
      created: fragment.created,
      updated: fragment.updated,
      type: 'application/json',
      size: jsonString.length
    });
  });

  // Test getting info for a markdown fragment
  test('returns fragment info for text/markdown fragment', async () => {
    const markdownData = '# Title\n\nSome **bold** text.';
    
    // Create a markdown fragment
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send(markdownData);

    expect(postRes.statusCode).toBe(201);
    const fragment = postRes.body.fragment;

    // Get fragment info
    const getRes = await request(app)
      .get(`/v1/fragments/${fragment.id}/info`)
      .auth('user1@email.com', 'password1');

    expect(getRes.statusCode).toBe(200);
    expect(getRes.body.status).toBe('ok');
    expect(getRes.body.fragment).toEqual({
      id: fragment.id,
      ownerId: fragment.ownerId,
      created: fragment.created,
      updated: fragment.updated,
      type: 'text/markdown',
      size: markdownData.length
    });
  });

  // Test that info contains all required fields
  test('fragment info contains all required metadata fields', async () => {
    // Create a fragment
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('Test content');

    expect(postRes.statusCode).toBe(201);
    const fragmentId = postRes.body.fragment.id;

    // Get fragment info
    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}/info`)
      .auth('user1@email.com', 'password1');

    expect(getRes.statusCode).toBe(200);
    expect(getRes.body.status).toBe('ok');
    
    const fragmentInfo = getRes.body.fragment;
    
    // Check all required fields exist
    expect(fragmentInfo).toHaveProperty('id');
    expect(fragmentInfo).toHaveProperty('ownerId');
    expect(fragmentInfo).toHaveProperty('created');
    expect(fragmentInfo).toHaveProperty('updated');
    expect(fragmentInfo).toHaveProperty('type');
    expect(fragmentInfo).toHaveProperty('size');
    
    // Check field types
    expect(typeof fragmentInfo.id).toBe('string');
    expect(typeof fragmentInfo.ownerId).toBe('string');
    expect(typeof fragmentInfo.created).toBe('string');
    expect(typeof fragmentInfo.updated).toBe('string');
    expect(typeof fragmentInfo.type).toBe('string');
    expect(typeof fragmentInfo.size).toBe('number');
    
    // Check that created and updated are valid ISO dates
    expect(new Date(fragmentInfo.created)).toBeInstanceOf(Date);
    expect(new Date(fragmentInfo.updated)).toBeInstanceOf(Date);
  });

  // Test with different user (should not find fragment)
  test('returns 404 when accessing another users fragment info', async () => {
    // Create fragment with user1
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('User1 fragment');

    expect(postRes.statusCode).toBe(201);
    const fragmentId = postRes.body.fragment.id;

    // Try to get info with user2
    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}/info`)
      .auth('user2@email.com', 'password2');

    expect(getRes.statusCode).toBe(404);
    expect(getRes.body.status).toBe('error');
    expect(getRes.body.error.message).toBe('Fragment not found');
  });

  // Test that info endpoint doesn't return fragment data, only metadata
  test('info endpoint returns only metadata, not fragment data', async () => {
    const secretData = 'This is secret fragment content';
    
    // Create a fragment
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(secretData);

    expect(postRes.statusCode).toBe(201);
    const fragmentId = postRes.body.fragment.id;

    // Get fragment info
    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}/info`)
      .auth('user1@email.com', 'password1');

    expect(getRes.statusCode).toBe(200);
    expect(getRes.body.status).toBe('ok');
    
    // Should not contain the actual fragment data
    expect(getRes.text).not.toContain(secretData);
    expect(getRes.body.fragment).not.toHaveProperty('data');
    expect(getRes.body.fragment).not.toHaveProperty('content');
  });
});