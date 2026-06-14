const db = require('../../config/db');
const { activeUserFilter } = require('../services/auth/accountStatus');

const ROLE_SEQUENCE = ['admin', 'teamLead', 'projectLead', 'legalTeam', 'employee'];
const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const LABEL_TO_ROLE = {
     admin: 'admin',
     administrator: 'admin',
     'team lead': 'teamLead',
     teamlead: 'teamLead',
     'project lead': 'projectLead',
     projectlead: 'projectLead',
     'legal team': 'legalTeam',
     legalteam: 'legalTeam',
     employee: 'employee',
};

const resolveRoleName = (role) => {
     if (role === undefined || role === null || role === '') {
          return null;
     }

     const numericRole = Number(role);
     if (Number.isInteger(numericRole) && numericRole > 0) {
          return ROLE_SEQUENCE[numericRole - 1] || null;
     }

     const normalizedRole = String(role).trim();
     const normalizedLower = normalizedRole.toLowerCase();
     const matchedRole = ROLE_SEQUENCE.find((value) => value.toLowerCase() === normalizedLower);
     if (matchedRole) {
          return matchedRole;
     }

     if (LABEL_TO_ROLE[normalizedLower]) {
          return LABEL_TO_ROLE[normalizedLower];
     }

     const spacedRole = normalizedRole.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
     return LABEL_TO_ROLE[spacedRole] || null;
};

class SystemEmployeeModel {
     static employeeInfo(alias = 'u') {
          return `
               ${alias}.id,
               ${alias}.company_id,
               ${alias}.first_name,
               ${alias}.last_name,
               CONCAT_WS(' ', ${alias}.first_name, ${alias}.last_name) AS employee_name,
               ${alias}.email,
               ${alias}.phone,
               ${alias}.is_password_changed,
               ${alias}.date_of_birth,
               ${alias}.role AS role_id,
               ${alias}.role,
               ${alias}.gender,
               ${alias}.address,
               ${alias}.tag,
               CASE WHEN ${alias}.status = 'active' THEN 1 ELSE 0 END AS is_active,
               CASE WHEN ${alias}.status = 'inactive' THEN 1 ELSE 0 END AS is_inactive,
               CASE WHEN ${alias}.status = 'blocked' THEN 1 ELSE 0 END AS is_blocked,
               CASE WHEN ${alias}.status = 'deleted' THEN 1 ELSE 0 END AS is_deleted,
               ${this.employeeStatus(alias)} AS status,
               ${alias}.joined_date,
               ${alias}.last_login,
               ${alias}.updated_at
          `;
     }

     static employeeStatus(alias = 'u') {
          return `
               CASE
                    WHEN ${alias}.status = 'deleted' THEN 'Deleted'
                    WHEN ${alias}.status = 'blocked' THEN 'Blocked'
                    WHEN ${alias}.status = 'inactive' THEN 'InActive'
                    ELSE 'Active'
               END
          `;
     }

     static baseFromClause(alias = 'u', companyType = 'steelmart') {
          let sql = `
               FROM employees ${alias}
               INNER JOIN companies c ON c.id = ${alias}.company_id
          `;
          if (companyType === 'all') {
               sql += ` WHERE 1=1 `;
          } else if (companyType === 'vendor') {
               sql += ` WHERE c.company_type = 'vendor' `;
          } else {
               sql += ` WHERE c.company_type = 'steelmart' `;
          }
          return sql;
     }

     static async getSteelmartCompanyId() {
          const [rows] = await db.query(`
               SELECT id
               FROM companies
               WHERE company_type = 'steelmart'
               ORDER BY id ASC
               LIMIT 1
          `);
          return rows[0]?.id || null;
     }

     static async getActiveUserByEmail(email) {
          try {
               const sql = `
                    SELECT ${this.employeeInfo('u')}, u.password
                    ${this.baseFromClause('u')}
                    AND ${activeUserFilter}
                    AND LOWER(u.email) = ?
                    LIMIT 1
               `;
               const [rows] = await db.query(sql, [normalizeEmail(email)]);
               return rows[0];
          } catch (error) {
               throw new Error(`Error fetching active user: ${error.message}`);
          }
     }

     static async getUserByEmail(email) {
          try {
               const sql = `
                    SELECT u.id, u.email
                    ${this.baseFromClause('u')}
                    AND LOWER(u.email) = ?
                    LIMIT 1
               `;
               const [rows] = await db.query(sql, [normalizeEmail(email)]);
               return rows[0];
          } catch (error) {
               throw new Error(`Error fetching user by email: ${error.message}`);
          }
     }

     static async getUserByEmailExceptId(email, employeeId) {
          try {
               const sql = `
                    SELECT u.id, u.email
                    ${this.baseFromClause('u')}
                    AND LOWER(u.email) = ?
                    AND u.id != ?
                    LIMIT 1
               `;
               const [rows] = await db.query(sql, [normalizeEmail(email), employeeId]);
               return rows[0];
          } catch (error) {
               throw new Error(`Error checking duplicate email: ${error.message}`);
          }
     }

     static async getRole(role) {
          try {
               const roleName = resolveRoleName(role);
               if (!roleName) {
                    return null;
               }

               return {
                    id: roleName,
                    role_name: roleName
               };
          } catch (error) {
               throw new Error(`Error fetching role: ${error.message}`);
          }
     }

     static buildEmployeeFilters({ search, role, status }) {
          const filters = [];
          const params = [];

          if (search) {
               const keyword = `%${search}%`;
               filters.push(`
                    (
                         u.first_name LIKE ? OR
                         u.last_name LIKE ? OR
                         CONCAT_WS(' ', u.first_name, u.last_name) LIKE ? OR
                         u.email LIKE ? OR
                         u.phone LIKE ? OR
                         u.role LIKE ?
                    )
               `);
               params.push(keyword, keyword, keyword, keyword, keyword, keyword);
          }

          const roleName = resolveRoleName(role);
          if (roleName) {
               filters.push('LOWER(u.role) = LOWER(?)');
               params.push(roleName);
          }

          if (status) {
               const normalizedStatus = String(status).trim().toLowerCase();
               if (normalizedStatus === 'active') {
                    filters.push(`u.status = 'active'`);
               } else if (normalizedStatus === 'inactive' || normalizedStatus === 'in_active' || normalizedStatus === 'inactiveemployee') {
                    filters.push(`u.status = 'inactive'`);
               } else if (normalizedStatus === 'blocked') {
                    filters.push(`u.status = 'blocked'`);
               } else if (normalizedStatus === 'deleted') {
                    filters.push(`u.status = 'deleted'`);
               }
          }

          return {
               whereSql: filters.length > 0 ? filters.join(' AND ') : '1=1',
               params
          };
     }

     static async getEmployeeStatusCounts({ search = '', role = '', companyType = 'steelmart' }) {
          try {
               const { whereSql, params } = this.buildEmployeeFilters({ search, role });
               const sql = `
                    SELECT status, COUNT(*) AS total
                    FROM (
                         SELECT ${this.employeeStatus('u')} AS status
                         ${this.baseFromClause('u', companyType)}
                         AND ${whereSql}
                    ) employee_statuses
                    GROUP BY status
               `;
               const [rows] = await db.query(sql, params);
               const counts = {
                    Active: 0,
                    InActive: 0,
                    Blocked: 0,
                    Deleted: 0
               };

               rows.forEach((row) => {
                    if (counts[row.status] !== undefined) {
                         counts[row.status] = Number(row.total) || 0;
                    }
               });

               return counts;
          } catch (error) {
               throw new Error(`Error fetching employee status counts: ${error.message}`);
          }
     }

     static async getEmployees({ search = '', role = '', status = '', page = 1, limit = 5, companyType = 'steelmart' }) {
          try {
               const offset = (page - 1) * limit;
               const { whereSql, params } = this.buildEmployeeFilters({ search, role, status });

               const countSql = `
                    SELECT COUNT(*) AS totalRecords
                    ${this.baseFromClause('u', companyType)}
                    AND ${whereSql}
               `;
               const [countRows] = await db.query(countSql, params);

               const sql = `
                    SELECT ${this.employeeInfo('u')}
                    ${this.baseFromClause('u', companyType)}
                    AND ${whereSql}
                    ORDER BY u.joined_date DESC, u.id DESC
                    LIMIT ? OFFSET ?
               `;
               const [employees] = await db.query(sql, [...params, limit, offset]);
               const statusCounts = await this.getEmployeeStatusCounts({ search, role, companyType });

               return {
                    employees,
                    totalRecords: countRows[0] ? Number(countRows[0].totalRecords) || 0 : 0,
                    statusCounts
               };
          } catch (error) {
               throw new Error(`Error fetching employees: ${error.message}`);
          }
     }

     static async createEmployee(employee) {
          try {
               const companyId = await this.getSteelmartCompanyId();
               if (!companyId) {
                    throw new Error('Steelmart company record not found');
               }
 
               const bcryptjs = require('bcryptjs');
               let hashedPassword = employee.password;
               if (!hashedPassword && employee.email) {
                    hashedPassword = await bcryptjs.hash(employee.email.trim().toLowerCase(), 10);
               }
 
               const sql = `
                    INSERT INTO employees (
                         company_id,
                         first_name,
                         last_name,
                         email,
                         phone,
                         password,
                         is_password_changed,
                         date_of_birth,
                         role,
                         gender,
                         address,
                         status,
                         created_by
                    )
                    VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, 'active', ?)
               `;
               const params = [
                    companyId,
                    employee.first_name,
                    employee.last_name,
                    employee.email,
                    employee.phone,
                    hashedPassword || null,
                    employee.date_of_birth || null,
                    employee.role,
                    employee.gender || null,
                    employee.address || null,
                    employee.created_by || null
               ];
               const [result] = await db.query(sql, params);
               return this.getEmployeeById(result.insertId);
          } catch (error) {
               throw new Error(`Error creating employee: ${error.message}`);
          }
     }

     static async getEmployeeById(employeeId) {
          try {
               const sql = `
                    SELECT ${this.employeeInfo('u')}
                    ${this.baseFromClause('u')}
                    AND u.id = ?
                    LIMIT 1
               `;
               const [rows] = await db.query(sql, [employeeId]);
               return rows[0];
          } catch (error) {
               throw new Error(`Error fetching employee profile: ${error.message}`);
          }
     }

     static async updateEmployee(employeeId, updates) {
          try {
               const allowedFields = [
                    'first_name',
                    'last_name',
                    'email',
                    'phone',
                    'password',
                    'date_of_birth',
                    'role',
                    'gender',
                    'address'
               ];
               const updateFields = [];
               const params = [];

               allowedFields.forEach((field) => {
                    if (updates[field] !== undefined) {
                         updateFields.push(`${field} = ?`);
                         params.push(updates[field]);
                    }
               });

               if (updateFields.length === 0) {
                    return this.getEmployeeById(employeeId);
               }

               params.push(employeeId);
               const sql = `
                    UPDATE employees
                    SET ${updateFields.join(', ')}, updated_at = NOW()
                    WHERE id = ? AND status != 'deleted'
               `;
               await db.query(sql, params);
               return this.getEmployeeById(employeeId);
          } catch (error) {
               throw new Error(`Error updating employee profile: ${error.message}`);
          }
     }

     static async updateStatus(employeeId, status, extraWhereStatus = null) {
          const params = [status, employeeId];
          let sql = `
               UPDATE employees
               SET status = ?, updated_at = NOW()
               WHERE id = ?
          `;

          if (extraWhereStatus) {
               sql += ' AND status = ?';
               params.push(extraWhereStatus);
          }

          const [result] = await db.query(sql, params);
          return result.affectedRows > 0;
     }

     static async softDeleteEmployee(employeeId) {
          try {
               return this.updateStatus(employeeId, 'deleted');
          } catch (error) {
               throw new Error(`Error soft deleting employee: ${error.message}`);
          }
     }

     static async softBlockEmployee(employeeId) {
          try {
               return this.updateStatus(employeeId, 'blocked');
          } catch (error) {
               throw new Error(`Error soft blocked employee: ${error.message}`);
          }
     }

     static async softInactiveEmployee(employeeId) {
          try {
               return this.updateStatus(employeeId, 'inactive');
          } catch (error) {
               throw new Error(`Error marking employee as inactive: ${error.message}`);
          }
     }

     static async unblockEmployee(employeeId) {
          try {
               return this.updateStatus(employeeId, 'active', 'blocked');
          } catch (error) {
               throw new Error(`Error unblocking employee: ${error.message}`);
          }
     }

     static async activateEmployee(employeeId) {
          try {
               return this.updateStatus(employeeId, 'active');
          } catch (error) {
               throw new Error(`Error activating employee: ${error.message}`);
          }
     }

     static async getDeletedEmployeeById(employeeId) {
          try {
               const sql = `
                    SELECT ${this.employeeInfo('u')}
                    ${this.baseFromClause('u')}
                    AND u.id = ?
                    LIMIT 1
               `;
               const [rows] = await db.query(sql, [employeeId]);
               return rows[0];
          } catch (error) {
               throw new Error(`Error fetching deleted employee: ${error.message}`);
          }
     }

     static async restoreDeletedEmployee(employeeId) {
          try {
               return this.updateStatus(employeeId, 'active', 'deleted');
          } catch (error) {
               throw new Error(`Error restoring deleted employee: ${error.message}`);
          }
     }
}

module.exports = SystemEmployeeModel;