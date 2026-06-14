export const capitalizeFirstCharacter = (value) => {
  if (typeof value !== 'string') {
    return value;
  }

  return value.replace(/^(\s*)(\S)/, (match, whitespace, firstCharacter) => (
    `${whitespace}${firstCharacter.toUpperCase()}`
  ));
};

export const sanitizePhoneNumberInput = (value, maxDigits = 10) => {
  if (typeof value !== 'string') {
    return value;
  }

  return value.replace(/\D/g, '').slice(0, maxDigits);
};