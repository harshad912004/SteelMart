const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const otpGenerator = require('otp-generator');
const logger = require('../../common/utils/logger');
const VendorUser = require('../models/userModel');
const { normalizeEmail } = require('../../common/utils/normalize');
const { getUnavailableAccountMessage } = require('../../employee/services/auth/accountStatus');
const { sendPasswordResetResultEmail, sendResetOtpEmail } = require('../../employee/services/auth/passwordResetMailer');
const { blockToken } = require('../services/tokenBlocklist');
const { sendSuccess, sendError } = require('../../common/utils/apiResponse');
const { buildTokenCookieOptions } = require('../../common/utils/authHelpers');
const OTPService = require('../../common/services/otpService');

const login = async (req, res) => {
     try {
          const email = normalizeEmail(req.body.email);
          const { password } = req.body;

          const vendor = await VendorUser.getVendorByEmailWithStatus(email);
          if (!vendor || !vendor.password) {
               return sendError(res, 401, 'Invalid credentials');
          }

          const unavailableAccountMessage = getUnavailableAccountMessage(vendor);
          if (unavailableAccountMessage) {
               return sendError(res, 403, unavailableAccountMessage);
          }

          const isMatch = await bcryptjs.compare(password, vendor.password);
          if (!isMatch) {
               return sendError(res, 401, 'Invalid credentials');
          }

          const token = jwt.sign(
               {
                    id: vendor.id,
                    email: vendor.email,
                    companyName: vendor.company_name,
                    role: vendor.role,
                    company_type: 'vendor'
               },
               process.env.JWT_SECRET_KEY,
               { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
          );

          res.cookie('token', token, buildTokenCookieOptions());

          await VendorUser.updateVendorLogin(email);

          return sendSuccess(res, 'Vendor login successful', {
               token,
               id: vendor.id,
               email: vendor.email,
               companyName: vendor.company_name,
               role: vendor.role,
               company_type: 'vendor',
               is_password_changed: vendor.is_password_changed,
               expiresIn: 3600
          });
     } catch (err) {
          logger.error('Error submitting vendor login form', {
               requestId: req.requestId,
               error: err.message
          });
          return sendError(res, 500, 'Error submitting vendor login form');
     }
};

const logout = async (req, res) => {
     try {
          blockToken(req.authToken, req.auth?.exp);
          res.clearCookie('token', buildTokenCookieOptions());
          return sendSuccess(res, 'Logout successful');
     } catch (err) {
          logger.error('Error while logging out vendor', {
               requestId: req.requestId,
               error: err.message
          });
          return sendError(res, 500, err.message);
     }
};

const sendForgetPasswordOtp = async (req, res) => {
     try {
          const email = normalizeEmail(req.body.email);
          const vendor = await VendorUser.getVendorByEmailWithStatus(email);

          if (!vendor) {
               return sendSuccess(res, 'If the account exists, an OTP will be sent to the registered email.');
          }

          const unavailableAccountMessage = getUnavailableAccountMessage(vendor);
          if (unavailableAccountMessage) {
               return sendError(res, 403, unavailableAccountMessage);
          }

          const otp = otpGenerator.generate(6, {
               lowerCaseAlphabets: false,
               upperCaseAlphabets: false,
               specialChars: false
          });
          const hashedOtp = await bcryptjs.hash(otp, 10);
          const expiresIn = Date.now() + 10 * 60 * 1000;

          await OTPService.storeOTP(email, hashedOtp, expiresIn);
          await sendResetOtpEmail(email, otp);

          return sendSuccess(res, 'OTP sent to your registered email', { email });
     } catch (err) {
          logger.error('Error sending vendor password reset OTP', {
               requestId: req.requestId,
               error: err.message
          });
          return sendError(res, 500, 'Error sending OTP');
     }
};

const verifyForgotPasswordOTP = async (req, res) => {
     try {
          const email = normalizeEmail(req.body.email);
          const { otp } = req.body;

          const verification = await OTPService.getOTP(email);
          if (!verification) {
               return sendError(res, 400, 'OTP not found');
          }

          if (Date.now() > verification.expiry) {
               await OTPService.deleteOTP(email);
               return sendError(res, 400, 'OTP expired');
          }

          if (verification.attempts >= 5) {
               await OTPService.deleteOTP(email);
               return sendError(res, 429, 'Too many attempts. Request new OTP');
          }

          const isMatch = await bcryptjs.compare(String(otp), verification.otp);
          if (!isMatch) {
               await OTPService.incrementAttempts(email);
               const updated = await OTPService.getOTP(email);

               if (updated.attempts >= 5) {
                    await OTPService.deleteOTP(email);
                    return sendError(res, 429, 'Too many attempts. OTP blocked');
               }

               return sendError(res, 400, 'Invalid OTP');
          }

          await OTPService.deleteOTP(email);

          const resetToken = jwt.sign(
               { email, company_type: 'vendor' },
               process.env.JWT_SECRET_KEY,
               { expiresIn: '10m' }
          );

          return sendSuccess(res, 'OTP verified successfully', { resetToken });
     } catch (err) {
          logger.error('Error verifying vendor OTP', {
               requestId: req.requestId,
               error: err.message
          });
          return sendError(res, 500, 'Error verifying OTP');
     }
};

const resetPasswordWithOTP = async (req, res, next) => {
     let email;
     try {
          const { resetToken, newPassword, confirmPassword } = req.body;

          let decoded;
          try {
               decoded = jwt.verify(resetToken, process.env.JWT_SECRET_KEY);
          } catch (err) {
               return sendError(res, 400, 'Invalid or expired token');
          }

          if (decoded.company_type !== 'vendor') {
               return sendError(res, 400, 'Invalid or expired token');
          }

          email = normalizeEmail(decoded.email);
          const vendor = await VendorUser.getVendorByEmailWithStatus(email);

          if (!vendor) {
               return sendError(res, 404, 'Vendor not found');
          }

          const unavailableAccountMessage = getUnavailableAccountMessage(vendor);
          if (unavailableAccountMessage) {
               await sendPasswordResetResultEmail(email, false, unavailableAccountMessage);
               return sendError(res, 403, unavailableAccountMessage);
          }

          const isMatch = vendor.password ? await bcryptjs.compare(newPassword, vendor.password) : false;
          if (isMatch) {
               await sendPasswordResetResultEmail(email, false, 'New password cannot be the same as the current password');
               return sendError(res, 400, 'Password already present');
          }

          const hashedPassword = await bcryptjs.hash(newPassword, 10);
          await VendorUser.resetPassword(email, hashedPassword);

          logger.info(`Vendor password reset successfully for ${email}`);
          await sendPasswordResetResultEmail(email, true);

          return sendSuccess(res, 'Password reset successfully');
     } catch (err) {
          if (email) {
               await sendPasswordResetResultEmail(email, false, 'An internal error occurred');
          }
          logger.error('Error resetting vendor password', {
               requestId: req.requestId,
               error: err.message
          });
          return sendError(res, 500, 'Error resetting password');
     }
};

module.exports = {
     login,
     logout,
     sendForgetPasswordOtp,
     verifyForgotPasswordOTP,
     resetPasswordWithOTP
};