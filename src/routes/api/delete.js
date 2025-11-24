const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

module.exports = async (req, res) => {
  const { id } = req.params;
  const ownerId = req.user;

  try {
    // First, verify the fragment exists and belongs to this user
    await Fragment.byId(ownerId, id);
    
    // Delete the fragment (metadata and data)
    await Fragment.delete(ownerId, id);
    
    logger.info(`Fragment ${id} deleted for user ${ownerId}`);
    
    res.status(200).json({
      status: 'ok'
    });
  } catch (err) {
    logger.error({ err, ownerId, id }, 'Error deleting fragment');
    res.status(404).json({
      status: 'error',
      error: { code: 404, message: 'Fragment not found' }
    });
  }
};

