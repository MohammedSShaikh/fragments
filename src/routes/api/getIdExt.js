const { Fragment } = require('../../model/fragment');
const MarkdownIt = require('markdown-it');
const md = new MarkdownIt();

module.exports = async (req, res) => {
  const rawId = req.params.id;
  const extMatch = rawId.match(/\.([a-zA-Z0-9]+)$/);
  const ext = extMatch ? extMatch[1] : null;
  const id = ext ? rawId.substring(0, rawId.lastIndexOf('.')) : rawId;
  const ownerId = req.user;

  try {
    const fragment = await Fragment.byId(ownerId, id);
    if (ext === 'html' && fragment.mimeType === 'text/markdown') {
      const buf = await fragment.getData();
      const html = md.render(buf.toString());
      res.set('Content-Type', 'text/html').send(html);
      return;
    }
    // fallback: just return raw data with the fragment's original Content-Type
    const data = await fragment.getData();
    res.set('Content-Type', fragment.type).send(data);
  } catch {
    res.status(404).json({
      status: 'error',
      error: { code: 404, message: 'Fragment not found or unsupported conversion.' }
    });
  }
};
