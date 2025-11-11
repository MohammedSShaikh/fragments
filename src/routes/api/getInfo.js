
const { Fragment } = require('../../model/fragment');

module.exports = async (req, res) => {
  const { id } = req.params;
  const ownerId = req.user;
  try {
    const fragment = await Fragment.byId(ownerId, id);
    res.status(200).json({
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
  } catch {
    res.status(404).json({
      status: 'error',
      error: { code: 404, message: 'Fragment not found' }
    });
  }
};
