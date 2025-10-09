const MemoryDB = require('../../src/model/data/memory/memory-db');
const {
  readFragment,
  writeFragment,
  readFragmentData,
  writeFragmentData,
} = require('../../src/model/data/memory');

describe('memory-db', () => {
  let db;

  beforeEach(() => {
    db = new MemoryDB();
  });

  test('put() returns nothing', async () => {
    const result = await db.put('a', 'b', {});
    expect(result).toBe(undefined);
  });

  test('get() returns what we put() into the db', async () => {
    const data = { value: 123 };
    await db.put('a', 'b', data);
    const result = await db.get('a', 'b');
    expect(result).toEqual(data);
  });

  test('put() and get() work with Buffers', async () => {
    const data = Buffer.from([1, 2, 3]);
    await db.put('a', 'b', data);
    const result = await db.get('a', 'b');
    expect(result).toEqual(data);
  });

  test('get() with incorrect secondaryKey returns nothing', async () => {
    await db.put('a', 'b', 123);
    const result = await db.get('a', 'c');
    expect(result).toBe(undefined);
  });

  test('query() returns all secondaryKey values', async () => {
    await db.put('a', 'a', { value: 1 });
    await db.put('a', 'b', { value: 2 });
    await db.put('a', 'c', { value: 3 });

    const results = await db.query('a');
    expect(Array.isArray(results)).toBe(true);
    expect(results).toEqual([{ value: 1 }, { value: 2 }, { value: 3 }]);
  });
  
  test('query() returns empty array', async () => {
    await db.put('b', 'a', { value: 1 });
    await db.put('b', 'b', { value: 2 });
    await db.put('b', 'c', { value: 3 });

    const results = await db.query('a');
    expect(Array.isArray(results)).toBe(true);
    expect(results).toEqual([]);
  });

  test('del() removes value put() into db', async () => {
    await db.put('a', 'a', { value: 1 });
    expect(await db.get('a', 'a')).toEqual({ value: 1 });
    await db.del('a', 'a');
    expect(await db.get('a', 'a')).toBe(undefined);
  });

  test('del() throws if primaryKey and secondaryKey not in db', () => {
    expect(() => db.del('a', 'a')).rejects.toThrow();
  });

  test('get() expects string keys', () => {
    expect(async () => await db.get()).rejects.toThrow();
    expect(async () => await db.get(1)).rejects.toThrow();
    expect(async () => await db.get(1, 1)).rejects.toThrow();
  });

  test('put() expects string keys', () => {
    expect(async () => await db.put()).rejects.toThrow();
    expect(async () => await db.put(1)).rejects.toThrow();
    expect(async () => await db.put(1, 1)).rejects.toThrow();
  });

  test('query() expects string key', () => {
    expect(async () => await db.query()).rejects.toThrow();
    expect(async () => await db.query(1)).rejects.toThrow();
  });

  test('del() expects string keys', () => {
    expect(async () => await db.del()).rejects.toThrow();
    expect(async () => await db.del(1)).rejects.toThrow();
    expect(async () => await db.del(1, 1)).rejects.toThrow();
  });
});

describe('Required async functions from memory/index.js', () => {
  const ownerId = 'user1@example.com';
  const fragmentId = 'fragment-123';
  const fragment = { id: fragmentId, ownerId, type: 'text/plain', size: 256, created: new Date().toISOString(), updated: new Date().toISOString() };
  const fragmentData = Buffer.from('This is test fragment data');

  test('writeFragment() returns Promise and resolves to undefined', async () => {
    const result = writeFragment(fragment);
    expect(result).toBeInstanceOf(Promise);
    await expect(result).resolves.toBeUndefined();
  });

  test('readFragment() returns Promise and retrieves stored fragment', async () => {
    await writeFragment(fragment);
    const result = readFragment(ownerId, fragmentId);
    expect(result).toBeInstanceOf(Promise);
    const retrieved = await result;
    expect(retrieved).toEqual(fragment);
  });

  test('readFragment() returns undefined for non-existent fragment', async () => {
    await expect(readFragment(ownerId, 'non-existent')).resolves.toBeUndefined();
  });

  test('writeFragmentData() returns Promise and resolves to undefined', async () => {
    const result = writeFragmentData(ownerId, fragmentId, fragmentData);
    expect(result).toBeInstanceOf(Promise);
    await expect(result).resolves.toBeUndefined();
  });

  test('readFragmentData() returns Promise and retrieves stored Buffer data', async () => {
    await writeFragmentData(ownerId, fragmentId, fragmentData);
    const result = readFragmentData(ownerId, fragmentId);
    expect(result).toBeInstanceOf(Promise);
    const retrieved = await result;
    expect(Buffer.isBuffer(retrieved)).toBe(true);
    expect(retrieved.toString()).toBe('This is test fragment data');
  });

  test('readFragmentData() returns undefined for non-existent data', async () => {
    await expect(readFragmentData(ownerId, 'non-existent')).resolves.toBeUndefined();
  });
});
