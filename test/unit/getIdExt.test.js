// tests/unit/getIdExt.test.js

const request = require('supertest');
const app = require('../../src/app');

describe('GET /v1/fragments/:id with extension', () => {
  // Authentication
  test('unauthenticated requests are denied', () =>
    request(app).get('/v1/fragments/123.txt').expect(401));

  test('incorrect credentials are denied', () =>
    request(app).get('/v1/fragments/123.txt').auth('invalid@email.com', 'incorrect_password').expect(401));

  // Error handling
  test('returns 404 for non-existent fragment', async () => {
    const res = await request(app)
      .get('/v1/fragments/non-existent-id.txt')
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(404);
  });

  // No extension
  test('returns original fragment without extension', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('Test content');

    const getRes = await request(app)
      .get(`/v1/fragments/${postRes.body.fragment.id}`)
      .auth('user1@email.com', 'password1');

    expect(getRes.statusCode).toBe(200);
    expect(getRes.text).toBe('Test content');
  });

  // Text conversions
  test('converts markdown to HTML', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send('# Hello\n**bold**');

    const getRes = await request(app)
      .get(`/v1/fragments/${postRes.body.fragment.id}.html`)
      .auth('user1@email.com', 'password1');

    expect(getRes.statusCode).toBe(200);
    expect(getRes.text).toContain('<h1>Hello</h1>');
  });

  test('converts markdown to txt', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send('# Title');

    const getRes = await request(app)
      .get(`/v1/fragments/${postRes.body.fragment.id}.txt`)
      .auth('user1@email.com', 'password1');

    expect(getRes.statusCode).toBe(200);
    expect(getRes.headers['content-type']).toBe('text/plain; charset=utf-8');
  });

  test('returns markdown with .md extension', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send('# Title');

    const getRes = await request(app)
      .get(`/v1/fragments/${postRes.body.fragment.id}.md`)
      .auth('user1@email.com', 'password1');

    expect(getRes.statusCode).toBe(200);
    expect(getRes.headers['content-type']).toBe('text/markdown; charset=utf-8');
  });

  test('converts HTML to txt', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/html')
      .send('<h1>Test</h1>');

    const getRes = await request(app)
      .get(`/v1/fragments/${postRes.body.fragment.id}.txt`)
      .auth('user1@email.com', 'password1');

    expect(getRes.statusCode).toBe(200);
  });

  // CSV conversions
  test('converts CSV to JSON', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/csv')
      .send('name,age\nJohn,30');

    const getRes = await request(app)
      .get(`/v1/fragments/${postRes.body.fragment.id}.json`)
      .auth('user1@email.com', 'password1');

    expect(getRes.statusCode).toBe(200);
    expect(JSON.parse(getRes.text)).toEqual([{ name: 'John', age: '30' }]);
  });

  test('returns 400 for invalid CSV to JSON', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/csv')
      .send('name,age');

    const getRes = await request(app)
      .get(`/v1/fragments/${postRes.body.fragment.id}.json`)
      .auth('user1@email.com', 'password1');

    expect(getRes.statusCode).toBe(400);
  });

  // JSON/YAML conversions
  test('converts JSON to YAML', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ name: 'John' }));

    const getRes = await request(app)
      .get(`/v1/fragments/${postRes.body.fragment.id}.yaml`)
      .auth('user1@email.com', 'password1');

    expect(getRes.statusCode).toBe(200);
    expect(getRes.text).toContain('name: John');
  });

  test('returns 400 for invalid JSON to YAML', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/json')
      .send('{"invalid": json}');

    const getRes = await request(app)
      .get(`/v1/fragments/${postRes.body.fragment.id}.yaml`)
      .auth('user1@email.com', 'password1');

    expect(getRes.statusCode).toBe(400);
  });

  test('converts JSON to txt', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ test: 'data' }));

    const getRes = await request(app)
      .get(`/v1/fragments/${postRes.body.fragment.id}.txt`)
      .auth('user1@email.com', 'password1');

    expect(getRes.statusCode).toBe(200);
  });

  test('returns YAML with .yml extension', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/yaml')
      .send('name: Jane');

    const getRes = await request(app)
      .get(`/v1/fragments/${postRes.body.fragment.id}.yml`)
      .auth('user1@email.com', 'password1');

    expect(getRes.statusCode).toBe(200);
  });

  // Image conversions
  test('converts image to jpg', async () => {
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/png')
      .send(pngBuffer);

    const getRes = await request(app)
      .get(`/v1/fragments/${postRes.body.fragment.id}.jpg`)
      .auth('user1@email.com', 'password1');

    expect(getRes.statusCode).toBe(200);
    expect(getRes.headers['content-type']).toContain('image/jpeg');
  });

  // Unsupported conversions
  test('returns 415 for unsupported conversion', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('Plain text');

    const getRes = await request(app)
      .get(`/v1/fragments/${postRes.body.fragment.id}.html`)
      .auth('user1@email.com', 'password1');

    expect(getRes.statusCode).toBe(415);
  });
});
