// tests/unit/delete.test.js

const request = require('supertest');
const app = require('../../src/app');

describe('DELETE /v1/fragments/:id', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () => 
    request(app).delete('/v1/fragments/123').expect(401));

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app).delete('/v1/fragments/123').auth('invalid@email.com', 'incorrect_password').expect(401));

  // Test deleting a non-existent fragment returns 404
  test('deleting non-existent fragment returns 404', async () => {
    const res = await request(app)
      .delete('/v1/fragments/non-existent-id')
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.code).toBe(404);
    expect(res.body.error.message).toBe('Fragment not found');
  });

  // Test successfully deleting a fragment
  test('authenticated user can delete their own fragment', async () => {
    // First, create a fragment
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('This fragment will be deleted');

    expect(postRes.statusCode).toBe(201);
    const fragmentId = postRes.body.fragment.id;

    // Delete the fragment
    const deleteRes = await request(app)
      .delete(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1');

    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.body.status).toBe('ok');

    // Verify the fragment is actually deleted by trying to get it
    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1');

    expect(getRes.statusCode).toBe(404);
  });

  // Test that a user cannot delete another user's fragment
  test('user cannot delete another user\'s fragment', async () => {
    // Create a fragment as user1
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('User1 fragment');

    expect(postRes.statusCode).toBe(201);
    const fragmentId = postRes.body.fragment.id;

    // Try to delete as user2
    const deleteRes = await request(app)
      .delete(`/v1/fragments/${fragmentId}`)
      .auth('user2@email.com', 'password2');

    expect(deleteRes.statusCode).toBe(404);
    expect(deleteRes.body.status).toBe('error');

    // Verify the fragment still exists for user1
    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1');

    expect(getRes.statusCode).toBe(200);
  });

  // Test deleting different types of fragments
  test('can delete JSON fragment', async () => {
    const jsonData = { message: 'Delete me', value: 42 };
    
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(jsonData));

    expect(postRes.statusCode).toBe(201);
    const fragmentId = postRes.body.fragment.id;

    const deleteRes = await request(app)
      .delete(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1');

    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.body.status).toBe('ok');
  });

  // Test deleting markdown fragment
  test('can delete markdown fragment', async () => {
    const markdownData = '# Title\n\nThis will be deleted.';
    
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send(markdownData);

    expect(postRes.statusCode).toBe(201);
    const fragmentId = postRes.body.fragment.id;

    const deleteRes = await request(app)
      .delete(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1');

    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.body.status).toBe('ok');
  });

  // Test that deleted fragment is removed from user's fragment list
  test('deleted fragment is removed from user\'s fragment list', async () => {
    // Create a fragment
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('Fragment to delete');

    expect(postRes.statusCode).toBe(201);
    const fragmentId = postRes.body.fragment.id;

    // Get fragments list before deletion
    const beforeRes = await request(app)
      .get('/v1/fragments')
      .auth('user1@email.com', 'password1');

    const fragmentsBefore = beforeRes.body.fragments;
    expect(fragmentsBefore).toContain(fragmentId);

    // Delete the fragment
    await request(app)
      .delete(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1');

    // Get fragments list after deletion
    const afterRes = await request(app)
      .get('/v1/fragments')
      .auth('user1@email.com', 'password1');

    const fragmentsAfter = afterRes.body.fragments;
    expect(fragmentsAfter).not.toContain(fragmentId);
  });
});

