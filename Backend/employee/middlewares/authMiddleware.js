const jwt = require('jsonwebtoken');
const logger = require('../../common/utils/logger');
const { sendError } = require('../../common/utils/apiResponse');
const User = require('../models/userModel');
const { getUnavailableAccountMessage } = require('../services/auth/accountStatus');
const { extractToken } = require('../../common/utils/authHelpers');

const isAuthenticated = async (req, res, next) => {
     const token = extractToken(req);
     if (!token) {
          return sendError(res, 401, 'Authentication token not found. Please login.');
     }

     try {
          const jwtSecret = process.env.JWT_SECRET_KEY;
          if (!jwtSecret) {
               logger.error('JWT secret is not configured', {
                    requestId: req.requestId
               });
               return sendError(res, 500, 'Authentication is not configured correctly.');
          }

          const decoded = jwt.verify(token, jwtSecret);
          if (!decoded?.email || !decoded?.id) {
               return sendError(res, 401, 'Invalid token. Please login again.');
          }

          const user = await User.getUserByEmailWithStatus(decoded.email);
          if (!user || Number(user.id) !== Number(decoded.id)) {
               return sendError(res, 401, 'Invalid login session. Please login again.');
          }

          const unavailableAccountMessage = getUnavailableAccountMessage(user);
          if (unavailableAccountMessage) {
               return sendError(res, 403, unavailableAccountMessage);
          }

          req.user = {
               id: user.id,
               email: user.email,
               role: user.role
          };
          req.auth = decoded;
          next();
     } catch (err) {
          logger.error('Authentication failed', {
               requestId: req.requestId,
               error: err.message
          });
          return sendError(res, 401, 'Invalid token. Please login again.');
     }
};

module.exports = { isAuthenticated };