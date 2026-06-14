const db = require('../../config/db');
const { normalizePagination } = require('../../common/utils/pagination');

const mapRoleToEnum = (role) => {
     if (!role) return 'employee';
     const clean = String(role).trim().toLowerCase();
     if (clean === 'admin' || clean === 'administrator') return 'admin';
     if (clean === 'team lead' || clean === 'teamlead') return 'teamLead';
     if (clean === 'project lead' || clean === 'projectlead') return 'projectLead';
     if (clean === 'legal team' || clean === 'legalteam') return 'legalTeam';
     return 'employee';
};

const employeeSelect = `
     e.id,
     e.company_id AS client_id,
     e.first_name,
     e.last_name,
     e.phone,
     e.email,
     COALESCE(e.role, CASE WHEN e.is_admin = 1 THEN 'admin' ELSE 'employee' END) AS designation,
     e.is_admin,
     e.tag,
     e.joined_date AS created_at,
     e.updated_at
`;

class EmployeeModel {
     static activeFilters() {
          return [`e.status <> 'deleted'`, `c.status <> 'deleted'`];
     }

     static async getEmployeesByCompany(clientId, page = 1, limit = 10, search = '') {
          try {
               const pagination = normalizePagination(page, limit);
               const filters = ['e.company_id = ?', ...this.activeFilters()];
               const params = [clientId];
               const searchTerm = String(search || '').trim();

               if (searchTerm) {
                    const likeTerm = `%${searchTerm}%`;
                    filters.push(`(
                         e.first_name LIKE ? OR
                         e.last_name LIKE ? OR
                         CONCAT_WS(' ', e.first_name, e.last_name) LIKE ? OR
                         e.email LIKE ? OR
                         e.phone LIKE ? OR
                         COALESCE(e.role, CASE WHEN e.is_admin = 1 THEN 'admin' ELSE 'employee' END) LIKE ?
                    )`);
                    params.push(likeTerm, likeTerm, likeTerm, likeTerm, likeTerm, likeTerm);
               }

               const whereClause = filters.join(' AND ');
               const sql = `
                    SELECT ${employeeSelect}
                    FROM employees e
                    INNER JOIN companies c ON c.id = e.company_id
                    WHERE ${whereClause}
                    ORDER BY e.joined_date DESC, e.id DESC
                    LIMIT ? OFFSET ?
               `;
               const [results] = await db.query(sql, [...params, pagination.limit, pagination.offset]);

               const [countResult] = await db.query(
                    `SELECT COUNT(*) AS total
                     FROM employees e
                     INNER JOIN companies c ON c.id = e.company_id
                     WHERE ${whereClause}`,
                    params
               );

               return {
                    data: results,
                    total: Number(countResult[0]?.total) || 0,
                    page: pagination.page,
                    limit: pagination.limit,
                    pages: Math.ceil((Number(countResult[0]?.total) || 0) / pagination.limit)
               };
          } catch (error) {
               throw new Error(`Error fetching employees: ${error.message}`);
          }
     }

     static async getEmployeeById(id) {
          try {
               const sql = `
                    SELECT ${employeeSelect}
                    FROM employees e
                    INNER JOIN companies c ON c.id = e.company_id
                    WHERE e.id = ? AND e.status <> 'deleted' AND c.status <> 'deleted'
                    LIMIT 1
               `;
               const [rows] = await db.query(sql, [id]);
               return rows[0];
          } catch (error) {
               throw new Error(`Error fetching employee: ${error.message}`);
          }
     }

     static async getEmployeeByEmail(clientId, email) {
          try {
               const [rows] = await db.query(
                    `SELECT ${employeeSelect}
                     FROM employees e
                     INNER JOIN companies c ON c.id = e.company_id
                     WHERE e.company_id = ? AND LOWER(e.email) = LOWER(?) AND e.status <> 'deleted' AND c.status <> 'deleted'
                     LIMIT 1`,
                    [clientId, email]
               );
               return rows[0];
          } catch (error) {
               throw new Error(`Error fetching employee by email: ${error.message}`);
          }
     }

     static async getEmployeeByPhone(clientId, phone) {
          try {
               const [rows] = await db.query(
                    `SELECT ${employeeSelect}
                     FROM employees e
                     INNER JOIN companies c ON c.id = e.company_id
                     WHERE e.company_id = ? AND e.phone = ? AND e.status <> 'deleted' AND c.status <> 'deleted'
                     LIMIT 1`,
                    [clientId, phone]
               );
               return rows[0];
          } catch (error) {
               throw new Error(`Error fetching employee by phone: ${error.message}`);
          }
     }

     static async getActiveAdminForCompany(clientId, excludedEmployeeId = null) {
          try {
               const params = [clientId];
               let excludeClause = '';

               if (excludedEmployeeId) {
                    excludeClause = 'AND e.id <> ?';
                    params.push(excludedEmployeeId);
               }

               const sql = `
                    SELECT ${employeeSelect}
                    FROM employees e
                    INNER JOIN companies c ON c.id = e.company_id
                    WHERE e.company_id = ? AND e.is_admin = 1 AND e.status = 'active' AND c.status = 'active'
                    ${excludeClause}
                    LIMIT 1
               `;
               const [rows] = await db.query(sql, params);
               return rows[0];
          } catch (error) {
               throw new Error(`Error fetching company admin: ${error.message}`);
          }
     }

     static async createEmployee(clientId, data, creatorId = null) {
          try {
               const roleValue = mapRoleToEnum(data.role || data.designation);
               const bcryptjs = require('bcryptjs');
               const hashedPassword = data.email ? await bcryptjs.hash(data.email.trim().toLowerCase(), 10) : null;
               const [result] = await db.query(
                    `INSERT INTO employees (company_id, first_name, last_name, phone, email, password, is_password_changed, role, is_admin, tag, status, created_by)
                     VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, 'active', ?)`,
                    [
                         clientId,
                         data.first_name,
                         data.last_name || '',
                         data.phone || null,
                         data.email || null,
                         hashedPassword,
                         roleValue,
                         data.is_admin ? 1 : 0,
                         data.tag || null,
                         creatorId
                    ]
               );
               return result.insertId;
          } catch (error) {
               throw new Error(`Error creating employee: ${error.message}`);
          }
     }

     static async updateEmployee(id, data) {
          try {
               const updateFields = [];
               const params = [];

               if (data.first_name !== undefined) {
                    updateFields.push('first_name = ?');
                    params.push(data.first_name);
               }
               if (data.last_name !== undefined) {
                    updateFields.push('last_name = ?');
                    params.push(data.last_name || '');
               }
               if (data.phone !== undefined) {
                    updateFields.push('phone = ?');
                    params.push(data.phone || null);
               }
               if (data.email !== undefined) {
                    updateFields.push('email = ?');
                    params.push(data.email || null);
               }
               if (data.is_admin !== undefined) {
                    updateFields.push('is_admin = ?');
                    params.push(data.is_admin ? 1 : 0);
               }
               if (data.tag !== undefined) {
                    updateFields.push('tag = ?');
                    params.push(data.tag || null);
               }
               if (data.role !== undefined || data.designation !== undefined) {
                    updateFields.push('role = ?');
                    params.push(mapRoleToEnum(data.role || data.designation));
               } else if (data.is_admin !== undefined) {
                    updateFields.push('role = ?');
                    params.push(data.is_admin ? 'admin' : 'employee');
               }

               if (updateFields.length === 0) {
                    return false;
               }

               params.push(id);
               const [result] = await db.query(
                    `UPDATE employees
                     SET ${updateFields.join(', ')}, updated_at = NOW()
                     WHERE id = ? AND status <> 'deleted'`,
                    params
               );
               return result.affectedRows > 0;
          } catch (error) {
               throw new Error(`Error updating employee: ${error.message}`);
          }
     }

     static async deleteEmployee(id) {
          try {
               const [result] = await db.query(
                    `UPDATE employees
                     SET status = 'deleted', updated_at = NOW()
                     WHERE id = ? AND status <> 'deleted'`,
                    [id]
               );
               return result.affectedRows > 0;
          } catch (error) {
               throw new Error(`Error deleting employee: ${error.message}`);
          }
     }

     static async getEmployeesByDesignation(clientId, designation) {
          try {
               const normalizedDesignation = String(designation || '').trim().toLowerCase();
               const sql = `
                    SELECT ${employeeSelect}
                    FROM employees e
                    INNER JOIN companies c ON c.id = e.company_id
                    WHERE e.company_id = ? AND e.status <> 'deleted' AND c.status <> 'deleted'
                    AND (
                         LOWER(COALESCE(e.role, CASE WHEN e.is_admin = 1 THEN 'admin' ELSE 'employee' END)) = ? OR
                         LOWER(e.role) = ?
                    )
                    ORDER BY e.first_name ASC, e.last_name ASC
               `;
               const [results] = await db.query(sql, [clientId, normalizedDesignation, normalizedDesignation]);
               return results;
          } catch (error) {
               throw new Error(`Error fetching employees by designation: ${error.message}`);
          }
     }

     static async getCompanyAdmins(clientId) {
          try {
               const [results] = await db.query(
                    `SELECT ${employeeSelect}
                     FROM employees e
                     INNER JOIN companies c ON c.id = e.company_id
                     WHERE e.company_id = ? AND e.is_admin = 1 AND e.status <> 'deleted' AND c.status <> 'deleted'`,
                    [clientId]
               );
               return results;
          } catch (error) {
               throw new Error(`Error fetching company admins: ${error.message}`);
          }
     }

     static async searchEmployees(clientId, query) {
          try {
               const likeTerm = `%${String(query || '').trim()}%`;
               const sql = `
                    SELECT ${employeeSelect}
                    FROM employees e
                    INNER JOIN companies c ON c.id = e.company_id
                    WHERE e.company_id = ? AND e.status <> 'deleted' AND c.status <> 'deleted'
                    AND (
                         e.first_name LIKE ? OR
                         e.last_name LIKE ? OR
                         CONCAT_WS(' ', e.first_name, e.last_name) LIKE ? OR
                         e.email LIKE ? OR
                         e.phone LIKE ? OR
                         COALESCE(e.role, CASE WHEN e.is_admin = 1 THEN 'admin' ELSE 'employee' END) LIKE ?
                    )
                    ORDER BY e.first_name ASC, e.last_name ASC
               `;
               const [results] = await db.query(sql, [
                    clientId,
                    likeTerm,
                    likeTerm,
                    likeTerm,
                    likeTerm,
                    likeTerm,
                    likeTerm
               ]);
               return results;
          } catch (error) {
               throw new Error(`Error searching employees: ${error.message}`);
          }
     }
}

module.exports = EmployeeModel;
