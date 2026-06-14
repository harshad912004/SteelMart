const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
     if (res.headersSent) {
          return next(err);
     }

     const statusCode = err.statusCode || 500;
     const isServerError = statusCode >= 500;
     const message = isServerError ? 'Internal Server Error' : (err.message || 'Request failed');

     logger.error(err.message || 'Unhandled application error', {
          requestId: req.requestId,
          statusCode,
          method: req.method,
          path: req.originalUrl,
          stack: err.stack
     });

     res.status(statusCode).json({
          requestId: req.requestId,
          status: 'error',
          success: false,
          message
     });
};

module.exports = errorHandler;