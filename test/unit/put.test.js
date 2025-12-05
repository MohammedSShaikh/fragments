// tests/unit/put.test.js

const request = require('supertest');
const app = require('../../src/app');

describe('PUT /v1/fragments/:id', () => {
    // Authentication
    test('unauthenticated requests are denied', () =>
        request(app).put('/v1/fragments/123').expect(401));

    test('incorrect credentials are denied', () =>
        request(app).put('/v1/fragments/123').auth('invalid@email.com', 'incorrect_password').expect(401));

    // Error handling
    test('returns 404 for non-existent fragment', async () => {
        const res = await request(app)
            .put('/v1/fragments/non-existent-id')
            .auth('user1@email.com', 'password1')
            .set('Content-Type', 'text/plain')
            .send('Updated content');

        expect(res.statusCode).toBe(404);
    });

    test('returns 400 when Content-Type does not match', async () => {
        const postRes = await request(app)
            .post('/v1/fragments')
            .auth('user1@email.com', 'password1')
            .set('Content-Type', 'text/plain')
            .send('Original');

        const putRes = await request(app)
            .put(`/v1/fragments/${postRes.body.fragment.id}`)
            .auth('user1@email.com', 'password1')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify({ data: 'test' }));

        expect(putRes.statusCode).toBe(400);
    });

    // Successful updates
    test('successfully updates a text/plain fragment', async () => {
        const postRes = await request(app)
            .post('/v1/fragments')
            .auth('user1@email.com', 'password1')
            .set('Content-Type', 'text/plain')
            .send('Original');

        const putRes = await request(app)
            .put(`/v1/fragments/${postRes.body.fragment.id}`)
            .auth('user1@email.com', 'password1')
            .set('Content-Type', 'text/plain')
            .send('Updated');

        expect(putRes.statusCode).toBe(200);
        expect(putRes.body.fragment).toBeDefined();

        const getRes = await request(app)
            .get(`/v1/fragments/${postRes.body.fragment.id}`)
            .auth('user1@email.com', 'password1');

        expect(getRes.text).toBe('Updated');
    });

    test('successfully updates a JSON fragment', async () => {
        const postRes = await request(app)
            .post('/v1/fragments')
            .auth('user1@email.com', 'password1')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify({ name: 'John' }));

        const putRes = await request(app)
            .put(`/v1/fragments/${postRes.body.fragment.id}`)
            .auth('user1@email.com', 'password1')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify({ name: 'Jane' }));

        expect(putRes.statusCode).toBe(200);

        const getRes = await request(app)
            .get(`/v1/fragments/${postRes.body.fragment.id}`)
            .auth('user1@email.com', 'password1');

        expect(JSON.parse(getRes.text)).toEqual({ name: 'Jane' });
    });

    test('successfully updates an image fragment', async () => {
        const pngBuffer = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            'base64'
        );

        const postRes = await request(app)
            .post('/v1/fragments')
            .auth('user1@email.com', 'password1')
            .set('Content-Type', 'image/png')
            .send(pngBuffer);

        const putRes = await request(app)
            .put(`/v1/fragments/${postRes.body.fragment.id}`)
            .auth('user1@email.com', 'password1')
            .set('Content-Type', 'image/png')
            .send(pngBuffer);

        expect(putRes.statusCode).toBe(200);
    });

    // Response structure
    test('PUT response includes fragment and formats', async () => {
        const postRes = await request(app)
            .post('/v1/fragments')
            .auth('user1@email.com', 'password1')
            .set('Content-Type', 'text/plain')
            .send('Original');

        const putRes = await request(app)
            .put(`/v1/fragments/${postRes.body.fragment.id}`)
            .auth('user1@email.com', 'password1')
            .set('Content-Type', 'text/plain')
            .send('Updated');

        expect(putRes.body.fragment).toBeDefined();
        expect(putRes.body.formats).toBeDefined();
    });

    // Multiple updates
    test('allows multiple updates', async () => {
        const postRes = await request(app)
            .post('/v1/fragments')
            .auth('user1@email.com', 'password1')
            .set('Content-Type', 'text/plain')
            .send('V1');

        await request(app)
            .put(`/v1/fragments/${postRes.body.fragment.id}`)
            .auth('user1@email.com', 'password1')
            .set('Content-Type', 'text/plain')
            .send('V2');

        await request(app)
            .put(`/v1/fragments/${postRes.body.fragment.id}`)
            .auth('user1@email.com', 'password1')
            .set('Content-Type', 'text/plain')
            .send('V3');

        const getRes = await request(app)
            .get(`/v1/fragments/${postRes.body.fragment.id}`)
            .auth('user1@email.com', 'password1');

        expect(getRes.text).toBe('V3');
    });
});
