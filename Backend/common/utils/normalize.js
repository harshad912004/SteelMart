const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const parsePositiveInteger = (value) => {
     const parsed = Number(value);
     return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const splitFullName = (name) => {
     const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
     return {
          first_name: parts.shift() || '',
          last_name: parts.join(' ')
     };
};

module.exports = {
     normalizeEmail,
     parsePositiveInteger,
     splitFullName
};