const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

module.exports = async (req, res) => {
  try {
    const contentType = req.get('Content-Type');
    if (!contentType) {
      logger.error('Content-Type header is missing');
      return res.status(400).json({
        status: 'error',
        error: { code: 400, message: 'Content-Type header is required' }
      });
    }

    // Check if Fragment supports this type
    if (!Fragment.isSupportedType(contentType)) {
      logger.error(`Unsupported Content-Type: ${contentType}`);
      return res.status(415).json({
        status: 'error',
        error: { code: 415, message: `Unsupported Content-Type: ${contentType}` }
      });
    }
    // Check if we got a valid Buffer from the raw body parser
    if (!Buffer.isBuffer(req.body)) {
      logger.error('Request body is not a Buffer');
      return res.status(415).json({
        status: 'error',
        error: { code: 415, message: 'Unsupported Media Type' }
      });
    }

    // Create new fragment
    const fragment = new Fragment({
      ownerId: req.user,
      type: contentType,
      size: req.body.length
    });

    // Save fragment metadata and data
    await fragment.save();
    await fragment.setData(req.body);
    logger.info(`Fragment ${fragment.id} created for user ${req.user}`);

    // Create Location header URL
    const apiUrl = process.env.API_URL || `${req.protocol}://${req.get('host')}`;
    const location = `${apiUrl}/v1/fragments/${fragment.id}`;

    // Return successful response
    res.status(201)
      .location(location)
      .json({
        status: 'ok',
        fragment: {
          id: fragment.id,
          ownerId: fragment.ownerId,
          created: fragment.created,
          updated: fragment.updated,
          type: fragment.type,
          size: fragment.size
        }
      });

  } catch (error) {
    logger.error('Error creating fragment:', error);
    res.status(500).json({
      status: 'error',
      error: { code: 500, message: 'Internal Server Error' }
    });
  }
};
