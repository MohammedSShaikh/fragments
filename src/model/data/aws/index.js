// src/model/data/aws/index.js

const MemoryDB = require('../memory/memory-db');
const s3Client = require('./s3Client');
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const logger = require('../../../logger');

// Create two in-memory databases: one for fragment metadata and the other for raw data
const metadata = new MemoryDB();

// Writes a fragment's data to an S3 Object in a Bucket
// https://github.com/awsdocs/aws-sdk-for-javascript-v3/blob/main/doc_source/s3-example-creating-buckets.md#upload-an-existing-object-to-an-amazon-s3-bucket
async function writeFragmentData(ownerId, id, dataBuffer) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${ownerId}/${id}`,
    Body: dataBuffer,
  };
  const command = new PutObjectCommand(params);

  try {
    await s3Client.send(command);
  } catch (err) {
    const { Bucket, Key } = params;
    logger.error({ 
      err: {
        message: err.message,
        name: err.name,
        code: err.code,
        statusCode: err.statusCode,
        stack: err.stack
      }, 
      Bucket, 
      Key 
    }, 'Error uploading fragment data to S3 - DETAILED');
    throw new Error(`S3 upload failed: ${err.message}`);
  }
}

// Converts a stream of data into a Buffer by collecting chunks
const streamToBuffer = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });

// Reads a fragment's data from S3 and returns (Promise<Buffer>)
// https://github.com/awsdocs/aws-sdk-for-javascript-v3/blob/main/doc_source/s3-example-creating-buckets.md#getting-a-file-from-an-amazon-s3-bucket
async function readFragmentData(ownerId, id) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${ownerId}/${id}`,
  };
  const command = new GetObjectCommand(params);

  try {
    const data = await s3Client.send(command);
    return streamToBuffer(data.Body);
  } catch (err) {
    const { Bucket, Key } = params;
    logger.error({ err, Bucket, Key }, 'Error streaming fragment data from S3');
    throw new Error('unable to read fragment data');
  }
}

// Deletes fragment's data from S3 and metadata from MemoryDB
async function deleteFragment(ownerId, id) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${ownerId}/${id}`,
  };
  const command = new DeleteObjectCommand(params);

  try {
    // Delete metadata from memory DB
    await metadata.del(ownerId, id);
    // Delete object from S3
    await s3Client.send(command);
  } catch (err) {
    const { Bucket, Key } = params;
    logger.error({ err, Bucket, Key }, 'Error deleting fragment data from S3');
    throw new Error('unable to delete fragment data');
  }
}

// Writes a fragment's metadata (not data) to memory DB. Returns a Promise
function writeFragment(fragment) {
  // Simulate db/network serialization of the value, storing only JSON representation.
  const serialized = JSON.stringify(fragment);
  return metadata.put(fragment.ownerId, fragment.id, serialized);
}

// Reads a fragment's metadata from memory DB. Returns a Promise
function readFragment(ownerId, id) {
  return metadata.get(ownerId, id).then(result => {
    if (!result) return null;
    // Parse the JSON string back to an object
    return JSON.parse(result);
  });
}

// Gets list of fragment IDs or expanded objects for a given user from memory DB. Returns a Promise
async function listFragments(ownerId, expand = false) {
  const fragments = await metadata.query(ownerId);
  if (expand || !fragments) {
    return fragments;
  }
  return fragments.map((fragment) => JSON.parse(fragment).id);
}

module.exports.listFragments = listFragments;
module.exports.writeFragment = writeFragment;
module.exports.readFragment = readFragment;
module.exports.writeFragmentData = writeFragmentData;
module.exports.readFragmentData = readFragmentData;
module.exports.deleteFragment = deleteFragment;
