const db = require('../../config/db');
const logger = require('../../common/utils/logger');

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

class VendorUser {
     static async getVendorByEmailWithStatus(email) {
          try {
               const sql = `
                    SELECT
                         e.id,
                         e.company_id AS client_id,
                         e.company_id AS company_id,
                         c.company_name,
                         e.first_name,
                         e.last_name,
                         e.email,
                         e.password,
                         e.is_password_changed,
                         'Vendor' AS role,
                         e.phone,
                         NULL AS gender,
                         CASE WHEN e.status = 'active' AND c.status = 'active' THEN 1 ELSE 0 END AS is_active,
                         CASE WHEN e.status = 'deleted' OR c.status = 'deleted' THEN 1 ELSE 0 END AS is_deleted,
                         CASE WHEN e.status = 'inactive' THEN 1 ELSE 0 END AS is_inactive,
                         CASE WHEN e.status = 'blocked' OR c.status = 'blocked' THEN 1 ELSE 0 END AS is_blocked,
                         CASE
                              WHEN e.status = 'blocked' OR c.status = 'blocked' THEN 'blocked'
                              WHEN e.status = 'deleted' OR c.status = 'deleted' THEN 'deleted'
                              WHEN e.status = 'inactive' OR c.status = 'inactive' THEN 'inactive'
                              ELSE 'active'
                         END AS status
                    FROM employees e
                    INNER JOIN companies c ON e.company_id = c.id
                    WHERE LOWER(e.email) = ?
                    AND c.company_type = 'vendor'
                    LIMIT 1
               `;
               const [rows] = await db.query(sql, [normalizeEmail(email)]);
               return rows[0];
          } catch (error) {
               logger.error('Error in VendorUser.getVendorByEmailWithStatus', { error: error.message, email });
               throw new Error(`Error fetching vendor status: ${error.message}`);
          }
     }

     static async updateVendorLogin(email) {
          try {
               const sql = `
                    UPDATE employees e
                    INNER JOIN companies c ON e.company_id = c.id
                    SET e.last_login = NOW(), e.updated_at = NOW()
                    WHERE LOWER(e.email) = ?
                    AND c.company_type = 'vendor'
               `;
               const [result] = await db.query(sql, [normalizeEmail(email)]);
               return result;
          } catch (error) {
               logger.error('Error in VendorUser.updateVendorLogin', { error: error.message, email });
               throw new Error(`Error updating vendor login timestamp: ${error.message}`);
          }
     }

     static async resetPassword(email, hashedPassword) {
          try {
               const sql = `
                    UPDATE employees e
                    INNER JOIN companies c ON e.company_id = c.id
                    SET e.password = ?, e.is_password_changed = 1, e.updated_at = NOW()
                    WHERE LOWER(e.email) = ?
                    AND c.company_type = 'vendor'
               `;
               await db.query(sql, [hashedPassword, normalizeEmail(email)]);
          } catch (error) {
               logger.error('Error in VendorUser.resetPassword', { error: error.message, email });
               throw new Error(`Error resetting vendor password: ${error.message}`);
          }
     }
}

module.exports = VendorUser;