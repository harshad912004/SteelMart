const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const {
     loginValidation,
     forgotPasswordRequestValidation,
     verifyForgotPasswordOtpValidation,
     resetPasswordValidation,
     validateRequest
} = require('../../common/utils/authValidators');
const { isVendorAuthenticated } = require('../middlewares/vendorAuthMiddleware');
const { authLimiter } = require('../../common/middlewares/rateLimiters');

router.post('/login', authLimiter, loginValidation, validateRequest, authController.login);
router.post('/logout', isVendorAuthenticated, authController.logout);
router.post('/forget-password/send-otp', authLimiter, forgotPasswordRequestValidation, validateRequest, authController.sendForgetPasswordOtp);
router.post('/forget-password/verify-otp', authLimiter, verifyForgotPasswordOtpValidation, validateRequest, authController.verifyForgotPasswordOTP);
router.post('/forget-password/reset-password', authLimiter, resetPasswordValidation, validateRequest, authController.resetPasswordWithOTP);

module.exports = router;