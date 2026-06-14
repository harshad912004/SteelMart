const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z0-9!@#$%^&*(),.?":{}|<>]{8,25}$/;
const PASSWORD_POLICY_MESSAGE = 'Password must be 8-25 characters and include uppercase, lowercase, number, and special character.';

module.exports = { PASSWORD_REGEX, PASSWORD_POLICY_MESSAGE };