const jwt = require('jsonwebtoken');
const logger = require('../../common/utils/logger');
const { sendError } = require('../../common/utils/apiResponse');
const VendorUser = require('../models/userModel');
const { getUnavailableAccountMessage } = require('../../employee/services/auth/accountStatus');
const { isTokenBlocked } = require('../services/tokenBlocklist');
const { extractToken } = require('../../common/utils/authHelpers');

const isVendorAuthenticated = async (req, res, next) => {
     const token = extractToken(req);
     if (!token) {
          return sendError(res, 401, 'Authentication token not found. Please login.');
     }

     try {
          if (isTokenBlocked(token)) {
               return sendError(res, 401, 'Invalid login session. Please login again.');
          }

          const jwtSecret = process.env.JWT_SECRET_KEY;
          if (!jwtSecret) {
               logger.error('JWT secret is not configured', {
                    requestId: req.requestId
               });
               return sendError(res, 500, 'Authentication is not configured correctly.');
          }

          const decoded = jwt.verify(token, jwtSecret);
          if (!decoded?.email || !decoded?.id || decoded.company_type !== 'vendor') {
               return sendError(res, 401, 'Invalid token. Please login again.');
          }

          const vendor = await VendorUser.getVendorByEmailWithStatus(decoded.email);
          if (!vendor || Number(vendor.id) !== Number(decoded.id)) {
               return sendError(res, 401, 'Invalid login session. Please login again.');
          }

          const unavailableAccountMessage = getUnavailableAccountMessage(vendor);
          if (unavailableAccountMessage) {
               return sendError(res, 403, unavailableAccountMessage);
          }

          req.user = {
               id: vendor.id,
               company_id: vendor.company_id || vendor.client_id,
               client_id: vendor.client_id || vendor.company_id,
               company_name: vendor.company_name,
               email: vendor.email,
               role: vendor.role
          };
          req.auth = decoded;
          req.authToken = token;
          next();
     } catch (err) {
          logger.error('Vendor authentication failed', {
               requestId: req.requestId,
               error: err.message
          });
          return sendError(res, 401, 'Invalid token. Please login again.');
     }
};

module.exports = { isVendorAuthenticated };