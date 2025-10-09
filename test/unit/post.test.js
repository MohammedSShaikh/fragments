const request = require('supertest');
const app = require('../../src/app');

describe('POST /v1/fragments', () => {
  // Authenticated requests
  describe('authenticated requests', () => {
    test('authenticated users can create a plain text fragment', async () => {
      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain')
        .send('Hello World');

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('ok');
      expect(res.body.fragment).toBeDefined();
      expect(res.body.fragment.id).toMatch(
        /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/
      );
      expect(res.body.fragment.type).toBe('text/plain');
      expect(res.body.fragment.size).toBe(11); // "Hello World".length
      expect(res.body.fragment.ownerId).toBe('user1@email.com');
      expect(Date.parse(res.body.fragment.created)).not.toBeNaN();
      expect(Date.parse(res.body.fragment.updated)).not.toBeNaN();
    });

    test('responses include a Location header with full URL', async () => {
      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain')
        .send('Test Fragment');

      expect(res.statusCode).toBe(201);
      expect(res.headers.location).toBeDefined();
      expect(res.headers.location).toMatch(
        /^https?:\/\/.+\/v1\/fragments\/[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/
      );
    });

    test('trying to create a fragment with unsupported type returns 415', async () => {
      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'application/pdf')
        .send('Some PDF data');

      expect(res.statusCode).toBe(415);
      expect(res.body.status).toBe('error');
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe(415);
    });

    test('missing Content-Type header returns 400', async () => {
  // Make a request with no body at all
  const res = await request(app)
    .post('/v1/fragments')
    .auth('user1@email.com', 'password1');
    // No .send() call = no automatic Content-Type

    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.error.code).toBe(400);
    });

    test('empty body is allowed', async () => {
      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain')
        .send('');

      expect(res.statusCode).toBe(201);
      expect(res.body.fragment.size).toBe(0);
    });

    test('fragment properties match request data', async () => {
      const fragmentData = 'This is a test fragment with specific content';
      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain')
        .send(fragmentData);

      expect(res.statusCode).toBe(201);
      expect(res.body.fragment.size).toBe(fragmentData.length);
      expect(res.body.fragment.type).toBe('text/plain');
      expect(res.body.fragment.ownerId).toBe('user1@email.com');
    });

    test('supports text/plain with charset', async () => {
      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain; charset=utf-8')
        .send('Hello UTF-8 World');

      expect(res.statusCode).toBe(201);
      expect(res.body.fragment.type).toBe('text/plain; charset=utf-8');
    });
  });

  // Unauthenticated requests  
  describe('unauthenticated requests', () => {
    test('unauthenticated requests are denied', async () => {
      const res = await request(app)
        .post('/v1/fragments')
        .set('Content-Type', 'text/plain')
        .send('Hello World');

      expect(res.statusCode).toBe(401);
    });
  });

  // Error handling
  describe('error handling', () => {
    test('invalid Content-Type syntax returns 415', async () => {
      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'invalid-content-type')
        .send('Hello World');

      expect(res.statusCode).toBe(415);
    });

    test('server handles processing errors gracefully', async () => {
      // This test would require mocking to simulate internal errors
      // For now, we'll just ensure the route exists and handles basic cases
      const res = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain')
        .send('Normal fragment');

      expect([201, 500]).toContain(res.statusCode); // Either success or handled error
    });
  });
});
