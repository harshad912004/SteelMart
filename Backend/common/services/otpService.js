const db = require('../../config/db');

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

class OTPService {
     static async storeOTP(email, otp, expiresIn) {
          try {
               const normalizedEmail = normalizeEmail(email);
               await db.query('DELETE FROM password_resets WHERE email = ?', [normalizedEmail]);
               await db.query(
                    'INSERT INTO password_resets(email, otp, expiry, attempts, created_at) VALUES(?, ?, ?, 0, NOW())',
                    [normalizedEmail, otp, expiresIn]
               );
          } catch (error) {
               throw new Error(`Error storing OTP: ${error.message}`);
          }
     }

     static async getOTP(email) {
          try {
               const [rows] = await db.query(
                    'SELECT email, otp, expiry, attempts FROM password_resets WHERE email = ?',
                    [normalizeEmail(email)]
               );
               return rows[0];
          } catch (error) {
               throw new Error(`Error fetching OTP: ${error.message}`);
          }
     }

     static async deleteOTP(email) {
          try {
               await db.query('DELETE FROM password_resets WHERE email = ?', [normalizeEmail(email)]);
          } catch (error) {
               throw new Error(`Error deleting OTP: ${error.message}`);
          }
     }

     static async incrementAttempts(email) {
          try {
               await db.query('UPDATE password_resets SET attempts = attempts + 1 WHERE email = ?', [normalizeEmail(email)]);
          } catch (error) {
               throw new Error(`Error incrementing attempts: ${error.message}`);
          }
     }
}

module.exports = OTPService;