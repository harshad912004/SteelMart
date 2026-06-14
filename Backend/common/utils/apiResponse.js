const withRequestId = (res, payload) => ({
     requestId: res.locals?.requestId,
     ...payload
});

const mergeData = (payload, data) => {
     if (data === null || data === undefined) { return payload; }

     if (typeof data === 'object' && !Array.isArray(data)) {
          Object.assign(payload, data);
          return payload;
     }

     payload.data = data;
     return payload;
};

const sendSuccess = (res, message, data = null, extras = {}) => {
     const payload = mergeData({
          success: true,
          message
     }, data);

     return res.status(200).json(withRequestId(res, { ...payload, ...extras }));
};

const sendCreated = (res, message, data = null, extras = {}) => {
     const payload = mergeData({
          success: true,
          message
     }, data);

     return res.status(201).json(withRequestId(res, { ...payload, ...extras }));
};

const sendError = (res, statusCode, message, extras = {}) =>
     res.status(statusCode).json(withRequestId(res, {
          success: false,
          message,
          ...extras
     }));

const sendValidationError = (res, message, extras = {}) => sendError(res, 400, message, extras);

module.exports = {
     sendSuccess,
     sendCreated,
     sendError,
     sendValidationError
};