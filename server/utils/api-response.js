const sendApiError = (res, status, code, error, details) => {
    const payload = {
        success: false,
        code,
        error
    };

    if (details !== undefined) {
        payload.details = details;
    }

    return res.status(status).json(payload);
};

const sendApiSuccess = (res, status, payload = {}) => {
    return res.status(status).json({
        success: true,
        ...payload
    });
};

module.exports = {
    sendApiError,
    sendApiSuccess
};
