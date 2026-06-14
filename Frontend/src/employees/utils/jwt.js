/**
 * JWT Token Utility
 * Decode JWT token to extract payload information
 */

/**
 * Decode JWT token
 * @param {string} token - JWT token
 * @returns {object} Decoded token payload
 */
export const decodeJWT = (token) => {
  try {
    if (!token) {
      throw new Error('Token is required');
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    // Decode the payload (second part)
    const payload = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(parts[1].length / 4) * 4, '=');
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  } 
};