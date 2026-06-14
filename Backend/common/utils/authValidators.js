const { body, validationResult } = require('express-validator');
const { PASSWORD_REGEX, PASSWORD_POLICY_MESSAGE } = require('./passwordPolicy');
const { sendValidationError } = require('./apiResponse');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const [firstError] = errors.array();
    return sendValidationError(res, firstError.msg, {
      errors: errors.array()
    });
  }
  next();
};

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

const forgotPasswordRequestValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required')
];

const verifyForgotPasswordOtpValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be a 6-digit code')
];

const resetPasswordValidation = [
  body('resetToken')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('newPassword')
    .matches(PASSWORD_REGEX)
    .withMessage(PASSWORD_POLICY_MESSAGE),
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Passwords do not match')
];

const profileUpdateValidation = [
  body('first_name')
    .trim()
    .isString()
    .notEmpty()
    .withMessage('First name is required'),

  body('last_name')
    .trim()
    .isString()
    .notEmpty()
    .withMessage('Last name is required'),

  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),

  body('password')
    .matches(PASSWORD_REGEX)
    .withMessage(PASSWORD_POLICY_MESSAGE),

  body('phone')
    .isMobilePhone('any')
    .withMessage('Valid phone number is required'),

  body('dob')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate()
    .withMessage('Valid Date of Birth is required'),

  body('gender')
    .optional({ checkFalsy: true })
    .customSanitizer(val => val.toLowerCase())
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
];

module.exports = {
  loginValidation,
  forgotPasswordRequestValidation,
  verifyForgotPasswordOtpValidation,
  resetPasswordValidation,
  profileUpdateValidation,
  validateRequest
};