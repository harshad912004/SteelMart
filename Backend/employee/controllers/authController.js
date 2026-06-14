const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const otpGenerator = require('otp-generator');
const logger = require('../../common/utils/logger');
const User = require('../models/userModel');
const { normalizeEmail } = require('../../common/utils/normalize');
const { getUnavailableAccountMessage } = require('../services/auth/accountStatus');
const { sendPasswordResetResultEmail, sendResetOtpEmail } = require('../services/auth/passwordResetMailer');
const { sendSuccess, sendCreated, sendError, sendValidationError } = require('../../common/utils/apiResponse');
const { buildTokenCookieOptions } = require('../../common/utils/authHelpers');
const OTPService = require('../../common/services/otpService');

const login = async (req, res, next) => {
     try {
          const email = normalizeEmail(req.body.email);
          const { password } = req.body;

          const user = await User.getUserByEmailWithStatus(email);
          if (!user) {
               return sendError(res, 401, 'Invalid credentials');
          }

          if (String(user.role || '').toLowerCase() === 'vendor') {
               return sendError(res, 401, 'Invalid credentials');
          }

          const unavailableAccountMessage = getUnavailableAccountMessage(user);
          if (unavailableAccountMessage) {
               return sendError(res, 403, unavailableAccountMessage);
          }

          if (!user.password) {
               return sendError(res, 401, 'Invalid credentials');
          }

          const isMatch = await bcryptjs.compare(password, user.password);
          if (!isMatch) {
               return sendError(res, 401, 'Invalid credentials');
          }

          const token = jwt.sign(
               {
                    id: user.id,
                    email: user.email,
                    role: user.role
               },
               process.env.JWT_SECRET_KEY,
               { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
          );

          res.cookie('token', token, buildTokenCookieOptions());

          await User.updateUserLogin(email);

          return sendSuccess(res, 'Login successful', {
               token: token,
               id: user.id,
               email: user.email,
               role: user.role,
               is_password_changed: user.is_password_changed,
               expiresIn: 3600
          });
     } catch (err) {
          logger.error('Error submitting login form', {
               requestId: req.requestId,
               error: err.message
          });
          return sendError(res, 500, 'Error submitting login form');
     }
};

const logout = async (req, res, next) => {
     try {
          res.clearCookie('token', buildTokenCookieOptions());
          return sendSuccess(res, 'Logout successful');
     } catch (err) {
          logger.error('Error while logging out', {
               requestId: req.requestId,
               error: err.message
          });
          return sendError(res, 500, err.message);
     }
};

const sendForgetPasswordOtp = async (req, res, next) => {
     try {
          const email = normalizeEmail(req.body.email);
          const user = await User.getUserByEmailWithStatus(email);
          if (!user) {
               return sendSuccess(res, 'If the account exists, an OTP will be sent to the registered email.');
          }

          const unavailableAccountMessage = getUnavailableAccountMessage(user);
          if (unavailableAccountMessage) {
               return sendError(res, 403, unavailableAccountMessage);
          }
          // Generate OTP     
          const otp = otpGenerator.generate(6, {
               lowerCaseAlphabets: false,
               upperCaseAlphabets: false,
               specialChars: false
          });
          const hashOTP = await bcryptjs.hash(otp, 10);
          let expiresIn = Date.now() + 10 * 60 * 1000;
          // Store OTP in database
          await OTPService.storeOTP(email, hashOTP, expiresIn);

          await sendResetOtpEmail(email, otp);
          return sendSuccess(res, 'OTP sent to your registered email', { email });

     }
     catch (err) {
          logger.error('Error sending password reset OTP', {
               requestId: req.requestId,
               error: err.message
          });
          return sendError(res, 500, 'Error sending OTP');
     }
}

// Verify OTP
const verifyForgotPasswordOTP = async (req, res, next) => {
     try {
          const email = normalizeEmail(req.body.email);
          const { otp } = req.body;

          const verification = await OTPService.getOTP(email);

          if (!verification) {
               return sendError(res, 400, 'OTP not found');
          }
          // Check expiry FIRST
          if (Date.now() > verification.expiry) {
               await OTPService.deleteOTP(email);
               return sendError(res, 400, 'OTP expired');
          }

          // Check attempt limit
          if (verification.attempts >= 5) {
               await OTPService.deleteOTP(email);
               return sendError(res, 429, 'Too many attempts. Request new OTP');
          }

          // Compare hashed OTP
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

          // OTP correct
          await OTPService.deleteOTP(email);

          //Generate reset token (10 min)
          const resetToken = jwt.sign(
               { email },
               process.env.JWT_SECRET_KEY,
               { expiresIn: "10m" }
          );


          return sendSuccess(res, 'OTP verified successfully', { resetToken });
     } catch (err) {
          logger.error('Error verifying OTP', {
               requestId: req.requestId,
               error: err.message
          });
          return sendError(res, 500, 'Error verifying OTP');
     }
};

// Reset password after OTP verification
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

          email = normalizeEmail(decoded.email);
          //check password already present
          let passVerify = await User.getUserByEmailWithStatus(email);
          if (!passVerify) {
               return sendError(res, 404, 'User not found');
          }

          const unavailableAccountMessage = getUnavailableAccountMessage(passVerify);
          if (unavailableAccountMessage) {
               await sendPasswordResetResultEmail(email, false, unavailableAccountMessage);
               return sendError(res, 403, unavailableAccountMessage);
          }

          let isMatch = await bcryptjs.compare(newPassword, passVerify.password);
          if (isMatch) {
               await sendPasswordResetResultEmail(email, false, 'New password cannot be the same as the current password');
               return sendError(res, 400, 'Password already present');
          }
          // Hash new password
          const hashedPassword = await bcryptjs.hash(newPassword, 10);

          // Reset password
          await User.resetPassword(email, hashedPassword);
          logger.info(`Password reset successfully for ${email}`);

          // Send OTP via email
          await sendPasswordResetResultEmail(email, true);
          return sendSuccess(res, 'Password reset successfully');
     } catch (err) {
          await sendPasswordResetResultEmail(email, false, 'An internal error occurred');
          logger.error('Error resetting password', {
               requestId: req.requestId,
               error: err.message
          });
          return sendError(res, 500, `Error resetting password`);
     }
};

module.exports = {
     login,
     logout,
     sendForgetPasswordOtp,
     verifyForgotPasswordOTP,
     resetPasswordWithOTP
};