// Use crypto.randomUUID() to create unique IDs, see:
// https://nodejs.org/api/crypto.html#cryptorandomuuidoptions
const { randomUUID } = require('crypto');
// Use https://www.npmjs.com/package/content-type to create/parse Content-Type headers
const contentType = require('content-type');

// Functions for working with fragment metadata/data using our DB
const {
  readFragment,
  writeFragment,
  readFragmentData,
  writeFragmentData,
  listFragments,
  deleteFragment,
} = require('./data');

const MarkdownIt = require('markdown-it');
const md = new MarkdownIt();

class Fragment {
  constructor({ id, ownerId, created, updated, type, size = 0 }) {
    // Validate required fields
    if (!ownerId || ownerId === null || ownerId === '') {
      throw new Error('ownerId is required');
    }
    if (!type) {
      throw new Error('type is required');
    }

    // Validate type is supported
    if (!Fragment.isSupportedType(type)) {
      throw new Error(`Unsupported type: ${type}`);
    }

    // Validate size
    if (typeof size !== 'number' || size < 0) {
      throw new Error('size must be a number >= 0');
    }

    this.id = id || randomUUID();
    this.ownerId = ownerId;
    this.type = type;
    this.size = size;
    this.created = created || new Date().toISOString();
    this.updated = updated || new Date().toISOString();
  }

  /**
   * Get all fragments (id or full) for the given user
   * @param {string} ownerId user's hashed email
   * @param {boolean} expand whether to expand ids to full fragments
   * @returns Promise<Array<Fragment>>
   */
  static async byUser(ownerId, expand = false) {
  const result = await listFragments(ownerId, expand);
  
  if (!result || result.length === 0) {
    return [];
  }
  // If expand is true, result contains JSON strings that need to be parsed
  if (expand) {
    return result.map(fragmentData => {
      // Parse the JSON string to get the actual fragment object
      const parsed = typeof fragmentData === 'string' ? JSON.parse(fragmentData) : fragmentData;
      // Create Fragment instance with the parsed data
      return new Fragment(parsed);
    });
  }  
  return result;
}

  /**
   * Gets a fragment for the user by the given id.
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise<Fragment>
   */
  static async byId(ownerId, id) {
    const fragment = await readFragment(ownerId, id);
    if (!fragment) {
      throw new Error(`unknown fragment id: ${id}`);
    }
    // Re-create a full Fragment instance from the database data
    return new Fragment(fragment);
  }

  /**
   * Delete the user's fragment data and metadata for the given id
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise<void>
   */
  static delete(ownerId, id) {
    return deleteFragment(ownerId, id);
  }

  /**
   * Saves the current fragment (metadata) to the database
   * @returns Promise<void>
   */
  save() {
    this.updated = new Date().toISOString();
    return writeFragment(this);
  }

  /**
   * Gets the fragment's data from the database
   * @returns Promise<Buffer>
   */
  getData() {
    return readFragmentData(this.ownerId, this.id);
  }

  /**
   * Set's the fragment's data in the database
   * @param {Buffer} data
   * @returns Promise<void>
   */
  async setData(data) {
    if (!Buffer.isBuffer(data)) {
      throw new Error('data must be a Buffer');
    }
    
    // Update the metadata whenever we change the data
    this.updated = new Date().toISOString();
    this.size = data.length;
    
    // Save both metadata and data
    await this.save();
    return writeFragmentData(this.ownerId, this.id, data);
  }

  /**
   * Returns the mime type (e.g., without encoding) for the fragment's type:
   * "text/html; charset=utf-8" -> "text/html"
   * @returns {string} fragment's mime type (without encoding)
   */
  get mimeType() {
    const { type } = contentType.parse(this.type);
    return type;
  }

  /**
   * Returns true if this fragment is a text/* mime type
   * @returns {boolean} true if fragment's type is text/*
   */
  get isText() {
    return this.mimeType.startsWith('text/');
  }

  /**
   * Returns the formats into which this fragment type can be converted
   * @returns {Array<string>} list of supported mime types
   */
  get formats() {
    // For now, just return the current mime type
    // Later this can be extended for format conversion
    return [this.mimeType];
  }

  /**
   * Returns true if we know how to work with this content type
   * @param {string} value a Content-Type value (e.g., 'text/plain' or 'text/plain: charset=utf-8')
   * @returns {boolean} true if we support this Content-Type (i.e., type/subtype)
   */
  static isSupportedType(value) {
    try {
      const { type } = contentType.parse(value);
      // Currently only text/plain is supported according to validTypes array
      const supportedTypes = [
        'text/plain',
        'text/markdown',
        'application/json'
      ];
      return supportedTypes.includes(type);
    } catch {
      return false;
    }
  }

  //Conversion Method
  async asConverted(ext) {
  const buf = await this.getData();
  if (this.mimeType === 'text/markdown' && ext === 'html') {
    // Markdown to HTML
    return {
      data: Buffer.from(md.render(buf.toString())),
      type: 'text/html'
    };
  }
  // Add more conversions as needed
  throw new Error('Unsupported conversion');
  }

}

module.exports.Fragment = Fragment;
