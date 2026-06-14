import { getToken } from '../auth/cookie';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const isBinaryBody = (body) => (
  body instanceof Blob
  || body instanceof ArrayBuffer
  || ArrayBuffer.isView(body)
);

const parseJsonResponse = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const createApiError = (data, response) => {
  const error = new Error(data?.message || `HTTP error! status: ${response.status}`);
  error.status = response.status;
  error.data = data;
  return error;
};

export const buildQuery = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    if (typeof value === 'string') {
      const trimmedValue = value.trim();
      if (!trimmedValue) {
        return;
      }

      query.set(key, trimmedValue);
      return;
    }

    query.set(key, String(value));
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
};

const requestCache = new Map();

const getCacheKey = (path, options) => {
  const method = options.method || 'GET';
  const headers = options.headers ? JSON.stringify([...new Headers(options.headers).entries()]) : '';
  const body = options.body ? String(options.body) : '';
  return `${method}:${path}:${headers}:${body}`;
};

export const request = async (path, options = {}) => {
  if (!API_BASE_URL) {
    throw new Error('API configuration is missing. Set VITE_API_URL before starting the app.');
  }

  const fetchPromise = (async () => {
    const { headers, body, ...restOptions } = options;
    const requestHeaders = new Headers(headers || {});
    const hasJsonBody = body !== undefined && body !== null && !(body instanceof FormData) && !isBinaryBody(body);

    if (hasJsonBody && !requestHeaders.has('Content-Type')) {
      requestHeaders.set('Content-Type', 'application/json');
    }

    let response;
    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        ...restOptions,
        headers: requestHeaders,
        body,
      });
    } catch {
      throw new Error('Unable to reach the server. Check your connection and try again.');
    }

    const data = await parseJsonResponse(response);
    if (!response.ok) {
      throw createApiError(data, response);
    }

    return data;
  })();

  return fetchPromise;
};

export const requestBlob = async (path, options = {}) => {
  if (!API_BASE_URL) {
    throw new Error('API configuration is missing. Set VITE_API_URL before starting the app.');
  }

  const { headers, body, ...restOptions } = options;
  const requestHeaders = new Headers(headers || {});
  const hasJsonBody = body !== undefined && body !== null && !(body instanceof FormData) && !isBinaryBody(body);

  if (hasJsonBody && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...restOptions,
      headers: requestHeaders,
      body,
    });
  } catch {
    throw new Error('Unable to reach the server. Check your connection and try again.');
  }

  if (!response.ok) {
    const data = await parseJsonResponse(response);
    throw createApiError(data, response);
  }

  return {
    blob: await response.blob(),
    headers: response.headers,
    status: response.status,
  };
};

export const authenticatedRequest = async (path, options = {}) => {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);

  return request(path, {
    ...options,
    headers,
  });
};

export const authenticatedRequestBlob = async (path, options = {}) => {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);

  return requestBlob(path, {
    ...options,
    headers,
  });
};