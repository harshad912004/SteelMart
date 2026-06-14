const { body, param, validationResult } = require('express-validator');
const { sendValidationError } = require('./apiResponse');
const { PASSWORD_REGEX, PASSWORD_POLICY_MESSAGE } = require('./passwordPolicy');

const PHONE_REGEX = /^\d{10}$/;
const NAME_REGEX = /^[A-Za-z ]{2,50}$/;
const CLIENT_TYPE_VALUES = ['generalcontractor', 'general contractor', 'vendor', 'steelmart'];

const validateClientTypeValue = (value) => {
     if (value === undefined || value === null || value === '') {
          return true;
     }

     if (Number.isInteger(Number(value)) && Number(value) > 0) {
          return true;
     }

     if (typeof value === 'string' && CLIENT_TYPE_VALUES.includes(value.trim().toLowerCase())) {
          return true;
     }

     throw new Error('Client type must be a valid identifier');
};

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

const validateIdParam = (name = 'id', label = 'ID') => param(name)
     .isInt({ gt: 0 })
     .withMessage(`${label} must be a valid number`);

const validateMultiIdParam = (params = []) => {
     if (!Array.isArray(params)) {
          throw new TypeError('params must be an array of { name, label } objects');
     }
     return params.map(({ name, label }) =>
          param(name)
               .isInt({ gt: 0 })
               .withMessage(`${label} must be a valid number`)
     );
};

const validateClientCreate = [
     body('company_name')
          .trim()
          .notEmpty()
          .withMessage('Company name is required'),
     body(['client_type_id', 'company_id', 'company_type', 'client_type'])
          .optional({ checkFalsy: true })
          .custom(validateClientTypeValue),
     body('website')
          .notEmpty()
          .withMessage('Website is required')
          .isURL({ require_tld: false })
          .withMessage('Please enter a valid website URL'),
     body('office_number')
          .notEmpty()
          .withMessage('Office number is required')
          .matches(/^[0-9+\-\s()]{7,20}$/)
          .withMessage('Please enter a valid office number'),
     body(['first_name', 'employee.first_name', 'contact.first_name'])
          .optional({ checkFalsy: true })
          .matches(NAME_REGEX)
          .withMessage('First name must be 2-50 alphabetic characters.'),
     body(['last_name', 'employee.last_name', 'contact.last_name'])
          .optional({ checkFalsy: true })
          .matches(NAME_REGEX)
          .withMessage('Last name must be 2-50 alphabetic characters.'),
     body(['email', 'employee.email', 'contact.email'])
          .optional({ checkFalsy: true })
          .isEmail()
          .normalizeEmail()
          .withMessage('Valid email is required'),
     body(['phone', 'employee.phone', 'contact.phone'])
          .optional({ checkFalsy: true })
          .matches(PHONE_REGEX)
          .withMessage('Please enter a valid 10-digit phone number.'),
     body(['designation', 'employee.designation', 'contact.designation'])
          .optional({ checkFalsy: true })
          .trim()
          .isLength({ max: 50 })
          .withMessage('Designation must be 50 characters or fewer'),
     body(['is_admin', 'employee.is_admin', 'contact.is_admin'])
          .optional()
          .isBoolean()
          .withMessage('is_admin must be a boolean value')
          .toBoolean(),
     body(['tag', 'employee.tag', 'contact.tag'])
          .optional({ nullable: true, checkFalsy: true })
          .trim()
          .isIn(['detailing', 'engineering', 'design', 'dockersAndJoist', 'welding', 'erection', 'structural', 'cnc', ''])
          .withMessage('Invalid tag selection')
];

const validateClientUpdate = [
     body('company_name')
          .optional({ checkFalsy: true })
          .trim()
          .notEmpty()
          .withMessage('Company name cannot be empty'),
     body(['client_type_id', 'company_id', 'company_type', 'client_type'])
          .optional({ checkFalsy: true })
          .custom(validateClientTypeValue),
     body('website')
          .optional({ checkFalsy: true })
          .isURL({ require_tld: false })
          .withMessage('Please enter a valid website URL'),
     body('office_number')
          .optional({ checkFalsy: true })
          .matches(/^[0-9+\-\s()]{7,20}$/)
          .withMessage('Please enter a valid office number')
];

const validateEmployeeCreate = [
     body('first_name')
          .trim()
          .notEmpty()
          .withMessage('First name is required')
          .matches(NAME_REGEX)
          .withMessage('First name must be 2-50 alphabetic characters.'),
     body('last_name')
          .optional({ checkFalsy: true })
          .matches(NAME_REGEX)
          .withMessage('Last name must be 2-50 alphabetic characters.'),
     body('email')
          .optional({ checkFalsy: true })
          .isEmail()
          .normalizeEmail()
          .withMessage('Valid email is required'),
     body('phone')
          .optional({ checkFalsy: true })
          .matches(PHONE_REGEX)
          .withMessage('Please enter a valid 10-digit phone number.'),
     body('designation')
          .optional({ checkFalsy: true })
          .trim()
          .isLength({ max: 50 })
          .withMessage('Designation must be 50 characters or fewer'),
     body('is_admin')
          .optional()
          .isBoolean()
          .withMessage('is_admin must be a boolean value')
          .toBoolean(),
     body('tag')
          .optional({ nullable: true, checkFalsy: true })
          .trim()
          .isIn(['detailing', 'engineering', 'design', 'dockersAndJoist', 'welding', 'erection', 'structural', 'cnc', ''])
          .withMessage('Invalid tag selection')
];

const validateEmployeeUpdate = [
     param('employeeId')
          .isInt({ gt: 0 })
          .withMessage('Employee ID must be a valid number'),
     body('first_name')
          .optional({ checkFalsy: true })
          .matches(NAME_REGEX)
          .withMessage('First name must be 2-50 alphabetic characters.'),
     body('last_name')
          .optional({ checkFalsy: true })
          .matches(NAME_REGEX)
          .withMessage('Last name must be 2-50 alphabetic characters.'),
     body('email')
          .optional({ checkFalsy: true })
          .isEmail()
          .normalizeEmail()
          .withMessage('Valid email is required'),
     body('phone')
          .optional({ checkFalsy: true })
          .matches(PHONE_REGEX)
          .withMessage('Please enter a valid 10-digit phone number.'),
     body('designation')
          .optional({ checkFalsy: true })
          .trim()
          .isLength({ max: 50 })
          .withMessage('Designation must be 50 characters or fewer'),
     body('is_admin')
          .optional()
          .isBoolean()
          .withMessage('is_admin must be a boolean value')
          .toBoolean(),
     body('tag')
          .optional({ nullable: true, checkFalsy: true })
          .trim()
          .isIn(['detailing', 'engineering', 'design', 'dockersAndJoist', 'welding', 'erection', 'structural', 'cnc', ''])
          .withMessage('Invalid tag selection')
];

const validateSystemEmployeeCreate = [
     body('first_name')
          .trim()
          .notEmpty()
          .withMessage('First name is required')
          .matches(NAME_REGEX)
          .withMessage('First name must be 2-50 alphabetic characters.'),
     body('last_name')
          .trim()
          .notEmpty()
          .withMessage('Last name is required')
          .matches(NAME_REGEX)
          .withMessage('Last name must be 2-50 alphabetic characters.'),
     body('email')
          .isEmail()
          .normalizeEmail()
          .withMessage('Valid email is required'),
     // body('password')
     //      .matches(PASSWORD_REGEX)
     //      .withMessage(PASSWORD_POLICY_MESSAGE),
     body('phone')
          .optional({ checkFalsy: true })
          .matches(PHONE_REGEX)
          .withMessage('Please enter a valid 10-digit phone number.'),
     body('date_of_birth')
          .optional({ checkFalsy: true })
          .isISO8601()
          .withMessage('Valid date of birth is required'),
     body('gender')
          .optional({ checkFalsy: true })
          .toLowerCase()
          .isIn(['male', 'female', 'other'])
          .withMessage('Gender must be male, female, or other.'),
     body(['role', 'role_id'])
          .custom((value, { req }) => {
               const roleValue = value ?? req.body.role_id ?? req.body.role;
               if (roleValue === undefined || roleValue === null || roleValue === '') { throw new Error('Role is required'); }
               if (Number.isInteger(Number(roleValue)) && Number(roleValue) > 0) { return true; }
               if (typeof roleValue === 'string' && roleValue.trim()) { return true; }
               throw new Error('Role is required');
          })
];

const validateSystemEmployeeUpdate = [
     validateIdParam('id', 'Employee ID'),
     body('first_name')
          .optional({ checkFalsy: true })
          .matches(NAME_REGEX)
          .withMessage('First name must be 2-50 alphabetic characters.'),
     body('last_name')
          .optional({ checkFalsy: true })
          .matches(NAME_REGEX)
          .withMessage('Last name must be 2-50 alphabetic characters.'),
     body('email')
          .optional({ checkFalsy: true })
          .isEmail()
          .normalizeEmail()
          .withMessage('Valid email is required'),
     body('password')
          .optional({ checkFalsy: true })
          .matches(PASSWORD_REGEX)
          .withMessage(PASSWORD_POLICY_MESSAGE),
     body('phone')
          .optional({ checkFalsy: true })
          .matches(PHONE_REGEX)
          .withMessage('Please enter a valid 10-digit phone number.'),
     body('date_of_birth')
          .optional({ checkFalsy: true })
          .isISO8601()
          .withMessage('Valid date of birth is required'),
     body('gender')
          .optional({ checkFalsy: true })
          .toLowerCase()
          .isIn(['male', 'female', 'other'])
          .withMessage('Gender must be male, female, or other.'),
     body(['role', 'role_id'])
          .optional({ nullable: true })
          .custom((value) => {
               if (value === undefined || value === null || value === '') { return true; }
               if (Number.isInteger(Number(value)) && Number(value) > 0) { return true; }
               if (typeof value === 'string' && value.trim()) { return true; }
               throw new Error('Role must be a valid role identifier');
          })
];

module.exports = {
     validateRequest,
     validateIdParam,
     validateMultiIdParam,
     validateClientCreate,
     validateClientUpdate,
     validateEmployeeCreate,
     validateEmployeeUpdate,
     validateSystemEmployeeCreate,
     validateSystemEmployeeUpdate
};