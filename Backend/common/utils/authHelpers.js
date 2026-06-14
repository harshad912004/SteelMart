const extractCookieToken = (cookieHeader = '') => {
     const cookies = cookieHeader
          .split(';')
          .map((cookie) => cookie.trim())
          .filter(Boolean);
     const tokenCookie = cookies.find((cookie) => cookie.startsWith('token='));

     if (!tokenCookie) {
          return null;
     }

     const tokenValue = tokenCookie.split('=').slice(1).join('=');
     return tokenValue ? decodeURIComponent(tokenValue) : null;
};

const extractToken = (req) => {
     const authHeader = req.headers.authorization || req.headers.Authorization;
     if (authHeader) {
          const [scheme, value] = String(authHeader).split(' ');
          if (/^Bearer$/i.test(scheme) && value) {
               return value.trim();
          }
     }

     if (req.headers.cookie) {
          return extractCookieToken(req.headers.cookie);
     }

     return null;
};

const buildTokenCookieOptions = () => ({
     httpOnly: true,
     sameSite: 'lax',
     secure: process.env.NODE_ENV === 'production',
     maxAge: 60 * 60 * 1000
});

module.exports = {
     extractCookieToken,
     extractToken,
     buildTokenCookieOptions
};