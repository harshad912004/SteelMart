const { randomUUID } = require('crypto');

const attachRequestContext = (req, res, next) => {
     const requestId = req.headers['x-request-id'] || randomUUID();
     res.locals.requestId = requestId;
     req.requestId = requestId;
     res.setHeader('X-Request-Id', requestId);
     next();
};

module.exports = { attachRequestContext };