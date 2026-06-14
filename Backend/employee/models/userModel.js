const db = require('../../config/db');
const { activeUserFilter } = require('../services/auth/accountStatus');

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

class User {
     static selectFields() {
          return `
               u.id,
               u.company_id,
               u.first_name,
               u.last_name,
               u.email,
               u.phone,
               u.password,
               u.is_password_changed,
               u.role,
               u.gender,
               u.status,
               CASE WHEN u.status = 'active' THEN 1 ELSE 0 END AS is_active,
               CASE WHEN u.status = 'inactive' THEN 1 ELSE 0 END AS is_inactive,
               CASE WHEN u.status = 'blocked' THEN 1 ELSE 0 END AS is_blocked,
               CASE WHEN u.status = 'deleted' THEN 1 ELSE 0 END AS is_deleted
          `;
     }

     static baseFromClause() {
          return `
               FROM employees u
               INNER JOIN companies c ON c.id = u.company_id
               WHERE c.company_type = 'steelmart'
          `;
     }

     static async getUserByEmail(email) {
          try {
               const sql = `
                    SELECT ${this.selectFields()}
                    ${this.baseFromClause()}
                    AND ${activeUserFilter}
                    AND LOWER(u.email) = ?
                    LIMIT 1
               `;
               const [rows] = await db.query(sql, [normalizeEmail(email)]);
               return rows[0];
          } catch (error) {
               throw new Error(`Error fetching user: ${error.message}`);
          }
     }

     static async getUserByEmailWithStatus(email) {
          try {
               const sql = `
                    SELECT ${this.selectFields()}
                    ${this.baseFromClause()}
                    AND LOWER(u.email) = ?
                    LIMIT 1
               `;
               const [rows] = await db.query(sql, [normalizeEmail(email)]);
               return rows[0];
          } catch (error) {
               throw new Error(`Error fetching user status: ${error.message}`);
          }
     }

     static async updateUserLogin(email) {
          try {
               const sql = `
                    UPDATE employees u
                    INNER JOIN companies c ON c.id = u.company_id
                    SET u.last_login = NOW()
                    WHERE c.company_type = 'steelmart' AND LOWER(u.email) = ?
               `;
               await db.query(sql, [normalizeEmail(email)]);
          } catch (error) {
               throw new Error(`Error updating user's last login timestamp: ${error.message}`);
          }
     }

     static async resetPassword(email, hashedPassword) {
          try {
               const sql = `
                    UPDATE employees u
                    INNER JOIN companies c ON c.id = u.company_id
                    SET u.password = ?, u.is_password_changed = 1, u.updated_at = NOW()
                    WHERE c.company_type = 'steelmart' AND LOWER(u.email) = ?
               `;
               await db.query(sql, [hashedPassword, normalizeEmail(email)]);
          } catch (error) {
               throw new Error(`Error resetting password: ${error.message}`);
          }
     }
}

module.exports = User;