// tests/unit/getIdExt.test.js

const request = require('supertest');
const app = require('../../src/app');

describe('GET /v1/fragments/:id with extension', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () =>
    request(app).get('/v1/fragments/123.txt').expect(401));

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app).get('/v1/fragments/123.txt').auth('invalid@email.com', 'incorrect_password').expect(401));

  // Test getting a fragment that doesn't exist
  test('returns 404 for non-existent fragment', async () => {
    const res = await request(app)
      .get('/v1/fragments/non-existent-id.txt')
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.code).toBe(404);
  });

  // Test creating and retrieving a text fragment with .txt extension
  test('returns fragment data with .txt extension for text/plain fragment', async () => {
    // First create a fragment
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('This is a test fragment');

    expect(postRes.statusCode).toBe(201);
    const fragmentId = postRes.body.fragment.id;

    // Then get it with .txt extension
    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}.txt`)
      .auth('user1@email.com', 'password1');

    expect(getRes.statusCode).toBe(200);
    expect(getRes.text).toBe('This is a test fragment');
    expect(getRes.headers['content-type']).toBe('text/plain; charset=utf-8');
  });

  // Test markdown to HTML conversion
  test('converts markdown fragment to HTML with .html extension', async () => {
    const markdownContent = '# Hello World\n\nThis is **bold** text.';

    // Create markdown fragment
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send(markdownContent);

    expect(postRes.statusCode).toBe(201);
    const fragmentId = postRes.body.fragment.id;

    // Get as HTML
    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}.html`)
      .auth('user1@email.com', 'password1');

    expect(getRes.statusCode).toBe(200);
    expect(getRes.headers['content-type']).toBe('text/html; charset=utf-8');
    expect(getRes.text).toContain('<h1>Hello World</h1>');
    expect(getRes.text).toContain('<strong>bold</strong>');
  });

  // Test getting fragment without extension (fallback)
  test('returns original fragment data without extension', async () => {
    // Create a JSON fragment
    const jsonData = { message: 'Hello World', count: 42 };

    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(jsonData));

    expect(postRes.statusCode).toBe(201);
    const fragmentId = postRes.body.fragment.id;

    // Get without extension
    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1');

    expect(getRes.statusCode).toBe(200);
    expect(getRes.headers['content-type']).toBe('application/json; charset=utf-8');
    expect(JSON.parse(getRes.text)).toEqual(jsonData);
  });

  // Test text/plain with .html extension (should return 415 - unsupported conversion)
  test('returns 415 when requesting unsupported .html extension for text/plain', async () => {
    // Create a text fragment
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('Plain text content');

    expect(postRes.statusCode).toBe(201);
    const fragmentId = postRes.body.fragment.id;

    // Get with .html extension (should return 415 - unsupported conversion)
    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}.html`)
      .auth('user1@email.com', 'password1');

    expect(getRes.statusCode).toBe(415);
    expect(getRes.body.status).toBe('error');
    expect(getRes.body.error.code).toBe(415);
  });

  // Test with different user (should not find fragment)
  test('returns 404 when accessing another users fragment', async () => {
    // Create fragment with user1
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('User1 fragment');

    expect(postRes.statusCode).toBe(201);
    const fragmentId = postRes.body.fragment.id;

    // Try to access with user2
    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}.txt`)
      .auth('user2@email.com', 'password2');

    expect(getRes.statusCode).toBe(404);
    expect(getRes.body.status).toBe('error');
  });

  // Test getting markdown fragment with .txt extension (converts to plain text)
  test('converts markdown fragment to plain text with .txt extension', async () => {
    const markdownContent = '# Title\n\nSome content.';

    // Create markdown fragment
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send(markdownContent);

    expect(postRes.statusCode).toBe(201);
    const fragmentId = postRes.body.fragment.id;

    // Get as .txt (should convert to plain text)
    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}.txt`)
      .auth('user1@email.com', 'password1');

    expect(getRes.statusCode).toBe(200);
    expect(getRes.text).toBe(markdownContent);
    expect(getRes.headers['content-type']).toBe('text/plain; charset=utf-8');
  });

  // Test JSON fragment with .json extension
  test('returns JSON fragment data with .json extension', async () => {
    const jsonData = { test: 'data', number: 123 };

    // Create JSON fragment
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(jsonData));

    expect(postRes.statusCode).toBe(201);
    const fragmentId = postRes.body.fragment.id;

    // Get with .json extension
    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}.json`)
      .auth('user1@email.com', 'password1');

    expect(getRes.statusCode).toBe(200);
    expect(JSON.parse(getRes.text)).toEqual(jsonData);
    expect(getRes.headers['content-type']).toBe('application/json; charset=utf-8');
  });
});
