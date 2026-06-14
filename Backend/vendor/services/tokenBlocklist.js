const blockedTokens = new Map();

const nowInSeconds = () => Math.floor(Date.now() / 1000);

const cleanupExpiredTokens = () => {
     const now = nowInSeconds();
     for (const [token, expiresAt] of blockedTokens.entries()) {
          if (expiresAt <= now) {
               blockedTokens.delete(token);
          }
     }
};

const blockToken = (token, expiresAt) => {
     if (!token || !expiresAt) return;
     cleanupExpiredTokens();
     blockedTokens.set(token, expiresAt);
};

const isTokenBlocked = (token) => {
     if (!token) return false;
     cleanupExpiredTokens();
     return blockedTokens.has(token);
};

module.exports = {
     blockToken,
     isTokenBlocked
};