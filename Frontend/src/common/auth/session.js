import { getRoleLabel } from '../../employees/constants/roles';
import { getToken, removeToken } from './cookie';
import { decodeJWT } from '../../employees/utils/jwt';

export const clearAuthenticatedSession = () => {
  removeToken();
  localStorage.removeItem('user');
};

export const getDecodedToken = () => {
  const token = getToken();
  if (!token) {
    return null;
  }

  const decoded = decodeJWT(token);
  const expiresAt = decoded?.exp ? decoded.exp * 1000 : null;

  if (!decoded || (expiresAt && expiresAt <= Date.now())) {
    clearAuthenticatedSession();
    return null;
  }

  return decoded;
};

export const isVendorSession = (decoded = getDecodedToken()) => {
  const role = String(decoded?.role || '').toLowerCase();
  return decoded?.accountType === 'vendor' || role === 'vendor';
};

export const getAuthenticatedHome = () => {
  const decoded = getDecodedToken();

  if (!decoded) {
    return null;
  }

  return isVendorSession(decoded) ? '/vendor/dashboard' : '/dashboard';
};

export const getCurrentUserSummary = () => {
  const decoded = getDecodedToken();
  if (!decoded) {
    return null;
  }

  return {
    decoded,
    email: decoded.email || 'User',
    companyName: decoded.companyName || decoded.company_name || '',
    role: getRoleLabel(decoded.role) || 'User',
    isAdmin: !isVendorSession(decoded),
    home: getAuthenticatedHome(),
  };
};
