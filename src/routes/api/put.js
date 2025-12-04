const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
const { createSuccessResponse, createErrorResponse } = require('../../response');

module.exports = async (req, res) => {
    const { id } = req.params;
    const ownerId = req.user;
    const contentType = req.get('Content-Type');

    try {
        // Check if fragment exists
        const fragment = await Fragment.byId(ownerId, id);

        // Check if Content-Type matches
        if (fragment.type !== contentType) {
            logger.warn({ ownerId, id, expected: fragment.type, actual: contentType }, 'Content-Type mismatch on PUT');
            return res.status(400).json(createErrorResponse(400, 'Content-Type does not match the fragment type'));
        }

        await fragment.setData(req.body);

        await fragment.save();

        logger.info({ ownerId, id }, 'Fragment updated');

        res.status(200).json(createSuccessResponse({
            fragment: fragment,
            formats: fragment.formats,
        }));
    } catch (err) {
        logger.error({ err, ownerId, id }, 'Error updating fragment');
        // If not found, Fragment.byId throws
        res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }
};
