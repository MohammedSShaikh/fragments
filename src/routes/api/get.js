const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
const { createSuccessResponse, createErrorResponse } = require('../../response');

module.exports = async (req, res) => {
  try {
    const ownerId = req.user;
    const expand = req.query.expand === '1' || req.query.expand === 'true';

    logger.debug({ ownerId, expand }, 'Fetching fragments for user');

    // Get fragments from the database
    let fragments = await Fragment.byUser(ownerId, expand);
    
    // Ensure we always return an array, never null or undefined
    if (!fragments || !Array.isArray(fragments)) {
      logger.debug({ ownerId, fragmentsReceived: fragments }, 'No fragments found or invalid format, returning empty array');
      fragments = [];
    }

    logger.info({ ownerId, fragmentCount: fragments.length, expand }, 'Successfully retrieved fragments for user');
    
    res.status(200).json(
      createSuccessResponse({
        fragments: fragments,
      })
    );
  } catch (err) {
    logger.error({ err, ownerId: req.user }, 'Error listing fragments');
    res.status(500).json(createErrorResponse(500, err.message));
  }
};
