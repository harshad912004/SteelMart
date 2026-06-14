export const ROLE_OPTIONS = [
  'Admin',
  'Team Lead',
  'Project Lead',
  'Legal Team',
  'Employee',
];

export const DIRECTORY_ROLE_OPTIONS = [...ROLE_OPTIONS, 'Client', 'Vendor'];

export const GENDER_OPTIONS = ['male', 'female'];

export const ROLE_LABELS = {
  1: 'Admin',
  2: 'Team Lead',
  3: 'Project Lead',
  4: 'Legal Team',
  5: 'Employee',
  admin: 'Admin',
  administrator: 'Admin',
  'team lead': 'Team Lead',
  teamlead: 'Team Lead',
  'project lead': 'Project Lead',
  projectlead: 'Project Lead',
  'legal team': 'Legal Team',
  legalteam: 'Legal Team',
  employee: 'Employee',
};

export const getRoleLabel = (role) => {
  if (role === undefined || role === null || role === '') {
    return '';
  }

  const normalizedRole = String(role).trim();
  const normalizedLower = normalizedRole.toLowerCase();

  if (ROLE_LABELS[normalizedRole]) {
    return ROLE_LABELS[normalizedRole];
  }

  if (ROLE_LABELS[normalizedLower]) {
    return ROLE_LABELS[normalizedLower];
  }

  const camelCaseToSpace = normalizedRole.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
  if (ROLE_LABELS[camelCaseToSpace]) {
    return ROLE_LABELS[camelCaseToSpace];
  }

  return String(role);
};