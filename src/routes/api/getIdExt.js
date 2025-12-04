const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
const MarkdownIt = require('markdown-it');
const md = new MarkdownIt();
const sharp = require('sharp');
const yaml = require('js-yaml');

module.exports = async (req, res) => {
  const rawId = req.params.id;
  const extMatch = rawId.match(/\.([a-zA-Z0-9]+)$/);
  const ext = extMatch ? extMatch[1] : null;
  const id = ext ? rawId.substring(0, rawId.lastIndexOf('.')) : rawId;
  const ownerId = req.user;

  try {
    const fragment = await Fragment.byId(ownerId, id);
    const data = await fragment.getData();

    // If no extension, return original
    if (!ext) {
      return res.set('Content-Type', fragment.type).send(data);
    }

    // TEXT CONVERSIONS

    // text/plain -> .txt
    if (fragment.type === 'text/plain' && ext === 'txt') {
      return res.set('Content-Type', 'text/plain').send(data);
    }

    // text/markdown -> .md, .html, .txt
    if (fragment.type === 'text/markdown') {
      if (ext === 'md') {
        return res.set('Content-Type', 'text/markdown').send(data);
      }
      if (ext === 'html') {
        const html = md.render(data.toString());
        return res.set('Content-Type', 'text/html').send(html);
      }
      if (ext === 'txt') {
        return res.set('Content-Type', 'text/plain').send(data);
      }
    }

    // text/html -> .html, .txt
    if (fragment.type === 'text/html') {
      if (ext === 'html') {
        return res.set('Content-Type', 'text/html').send(data);
      }
      if (ext === 'txt') {
        return res.set('Content-Type', 'text/plain').send(data);
      }
    }

    // text/csv -> .csv, .txt, .json
    if (fragment.type === 'text/csv') {
      if (ext === 'csv') {
        return res.set('Content-Type', 'text/csv').send(data);
      }
      if (ext === 'txt') {
        return res.set('Content-Type', 'text/plain').send(data);
      }
      if (ext === 'json') {
        // Simple CSV to JSON conversion (assumes first line is headers)
        const lines = data.toString().trim().split('\n');
        if (lines.length < 2) {
          return res.status(400).json({
            status: 'error',
            error: { code: 400, message: 'CSV must have at least a header and one data row' }
          });
        }
        const headers = lines[0].split(',').map(h => h.trim());
        const result = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          const obj = {};
          headers.forEach((header, i) => {
            obj[header] = values[i] || '';
          });
          return obj;
        });
        return res.set('Content-Type', 'application/json').send(JSON.stringify(result, null, 2));
      }
    }

    // application/json -> .json, .yaml, .yml, .txt
    if (fragment.type === 'application/json') {
      if (ext === 'json') {
        return res.set('Content-Type', 'application/json').send(data);
      }
      if (ext === 'yaml' || ext === 'yml') {
        try {
          const jsonData = JSON.parse(data.toString());
          const yamlData = yaml.dump(jsonData);
          return res.set('Content-Type', 'application/yaml').send(yamlData);
        } catch (err) {
          logger.warn({ err, id }, 'Error converting JSON to YAML');
          return res.status(400).json({
            status: 'error',
            error: { code: 400, message: 'Invalid JSON data' }
          });
        }
      }
      if (ext === 'txt') {
        return res.set('Content-Type', 'text/plain').send(data);
      }
    }

    // application/yaml -> .yaml, .txt
    if (fragment.type === 'application/yaml') {
      if (ext === 'yaml' || ext === 'yml') {
        return res.set('Content-Type', 'application/yaml').send(data);
      }
      if (ext === 'txt') {
        return res.set('Content-Type', 'text/plain').send(data);
      }
    }

    // IMAGE CONVERSIONS
    // All image types -> .png, .jpg, .jpeg, .webp, .gif, .avif
    const validImageExtensions = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'avif'];
    if (fragment.type.startsWith('image/') && validImageExtensions.includes(ext)) {
      try {
        const convertedData = await sharp(data)
          .toFormat(ext === 'jpg' ? 'jpeg' : ext)
          .toBuffer();

        return res.set('Content-Type', `image/${ext === 'jpg' ? 'jpeg' : ext}`).send(convertedData);
      } catch (err) {
        logger.warn({ err, id, ext }, 'Error converting image');
        return res.status(415).json({
          status: 'error',
          error: { code: 415, message: 'Unsupported image conversion' }
        });
      }
    }

    // If we reach here, the conversion is not supported
    return res.status(415).json({
      status: 'error',
      error: { code: 415, message: `Cannot convert ${fragment.type} to .${ext}` }
    });

  } catch (err) {
    logger.warn({ err, id }, 'Error getting fragment');
    return res.status(404).json({
      status: 'error',
      error: { code: 404, message: 'Fragment not found' }
    });
  }
};

