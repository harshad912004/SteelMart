const TOKEN_KEY = import.meta.env.VITE_AUTH_TOKEN_KEY || 'token';

export const setCookie = (name, value, options = {}) => {
  const { maxAge, path = '/', sameSite = 'Strict', secure = window.location.protocol === 'https:' } = options;
  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=${path}; SameSite=${sameSite}`;

  if (secure) cookie += '; Secure';
  if (maxAge !== undefined) cookie += `; max-age=${maxAge}`;

  document.cookie = cookie;
};

export const getCookie = (name) => {
  const key = `${encodeURIComponent(name)}=`;
  const found = document.cookie.split(';').find((cookie) => cookie.trim().startsWith(key));

  if (!found) {
    return null;
  }

  return decodeURIComponent(found.trim().slice(key.length));
};

export const removeCookie = (name) => {
  document.cookie = `${encodeURIComponent(name)}=; path=/; max-age=0; SameSite=Strict`;
};

export const getToken = () => getCookie(TOKEN_KEY);

export const setToken = (token, maxAge) => setCookie(TOKEN_KEY, token, { maxAge });

export const removeToken = () => removeCookie(TOKEN_KEY);