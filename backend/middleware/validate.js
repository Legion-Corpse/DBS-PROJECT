const validate = (schema) => (req, res, next) => {
    try {
        req.body = schema.parse(req.body);
        next();
    } catch (err) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                details: err.errors
            }
        });
    }
};

module.exports = validate;
