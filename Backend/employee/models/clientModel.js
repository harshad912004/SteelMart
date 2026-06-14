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

const COMPANY_TYPE_MAP = {
     1: 'generalContractor',
     2: 'vendor',
     3: 'steelmart'
};

const COMPANY_TYPE_IDS = Object.entries(COMPANY_TYPE_MAP).reduce((accumulator, [id, type]) => {
     accumulator[type] = Number(id);
     return accumulator;
}, {});

const normalizeCompanyType = (value) => {
     if (value === undefined || value === null || value === '') {
          return null;
     }

     const numericValue = Number(value);
     if (Number.isInteger(numericValue) && COMPANY_TYPE_MAP[numericValue]) {
          return COMPANY_TYPE_MAP[numericValue];
     }

     const normalized = String(value).trim().toLowerCase();
     if (normalized === 'vendor') return 'vendor';
     if (normalized === 'generalcontractor' || normalized === 'general contractor') return 'generalContractor';
     if (normalized === 'steelmart') return 'steelmart';
     return null;
};

const getClientTypeId = (companyType) => COMPANY_TYPE_IDS[companyType] || null;

const companySelect = `
     c.id,
     c.company_name,
     c.website,
     c.office_number,
     CASE
          WHEN c.company_type = 'generalContractor' THEN 1
          WHEN c.company_type = 'vendor' THEN 2
          WHEN c.company_type = 'steelmart' THEN 3
          ELSE NULL
     END AS client_type_id,
     c.company_type AS client_type,
     c.description,
     c.address,
     CASE WHEN c.status = 'active' THEN 1 ELSE 0 END AS is_active,
     CASE WHEN c.status = 'blocked' THEN 1 ELSE 0 END AS is_blocked,
     CASE WHEN c.status = 'deleted' THEN 1 ELSE 0 END AS is_deleted,
     c.status,
     c.created_at,
     c.updated_at
`;

class ClientModel {
     static async clientTypeExists(clientTypeId) {
          return Boolean(normalizeCompanyType(clientTypeId));
     }

     static async getClientTypeByName(typeName) {
          const companyType = normalizeCompanyType(typeName);
          if (!companyType) {
               return null;
          }

          return {
               id: getClientTypeId(companyType),
               type_name: companyType,
               description: companyType === 'vendor' ? 'Vendor company' : 'General contractor company'
          };
     }

     static async getDefaultClientTypeId() {
          return COMPANY_TYPE_IDS.generalContractor;
     }

     static baseFilters(includeDeleted = false) {
          const filters = [`c.company_type <> 'steelmart'`, `c.is_temp = 0`];
          if (!includeDeleted) {
               filters.push(`c.status <> 'deleted'`);
          }
          return filters;
     }

     static async getAllClients(page = 1, limit = 10, search = '', type = '') {
          try {
               const pagination = normalizePagination(page, limit);
               const filters = [...this.baseFilters()];
               const params = [];

               if (search) {
                    const keyword = `%${search}%`;
                    filters.push(`(
                         c.company_name LIKE ? OR
                         c.website LIKE ? OR
                         c.office_number LIKE ? OR
                         c.address LIKE ? OR
                         c.company_type LIKE ?
                    )`);
                    params.push(keyword, keyword, keyword, keyword, keyword);
               }

               const companyType = normalizeCompanyType(type);
               if (companyType) {
                    filters.push('c.company_type = ?');
                    params.push(companyType);
               }

               const whereClause = filters.join(' AND ');
               const sql = `
                    SELECT
                         ${companySelect},
                         COUNT(e.id) AS employee_count
                    FROM companies c
                    LEFT JOIN employees e
                         ON e.company_id = c.id
                         AND e.status <> 'deleted'
                    WHERE ${whereClause}
                    GROUP BY c.id
                    ORDER BY c.company_name ASC, c.id ASC
                    LIMIT ? OFFSET ?
               `;
               const [results] = await db.query(sql, [...params, pagination.limit, pagination.offset]);

               const countSql = `
                    SELECT COUNT(*) AS total
                    FROM companies c
                    WHERE ${whereClause}
               `;
               const [countResult] = await db.query(countSql, params);

               return {
                    data: results,
                    total: Number(countResult[0]?.total) || 0,
                    page: pagination.page,
                    limit: pagination.limit,
                    pages: Math.ceil((Number(countResult[0]?.total) || 0) / pagination.limit)
               };
          } catch (error) {
               throw new Error(`Error fetching clients: ${error.message}`);
          }
     }

     static async getClientById(id) {
          try {
               const sql = `
                    SELECT ${companySelect}
                    FROM companies c
                    WHERE c.id = ? AND c.company_type <> 'steelmart'
                    LIMIT 1
               `;
               const [rows] = await db.query(sql, [id]);
               return rows[0];
          } catch (error) {
               throw new Error(`Error fetching client: ${error.message}`);
          }
     }

     static async getClientsByType(typeId, page = 1, limit = 10) {
          try {
               const pagination = normalizePagination(page, limit);
               const companyType = normalizeCompanyType(typeId);
               const filters = [...this.baseFilters()];
               const params = [];

               if (companyType) {
                    filters.push('c.company_type = ?');
                    params.push(companyType);
               }

               const whereClause = filters.join(' AND ');
               const sql = `
                    SELECT
                         ${companySelect},
                         COUNT(e.id) AS employee_count
                    FROM companies c
                    LEFT JOIN employees e
                         ON e.company_id = c.id
                         AND e.status <> 'deleted'
                    WHERE ${whereClause}
                    GROUP BY c.id
                    ORDER BY c.company_name ASC, c.id ASC
                    LIMIT ? OFFSET ?
               `;
               const [results] = await db.query(sql, [...params, pagination.limit, pagination.offset]);

               const countSql = `
                    SELECT COUNT(*) AS total
                    FROM companies c
                    WHERE ${whereClause}
               `;
               const [countResult] = await db.query(countSql, params);

               return {
                    data: results,
                    total: Number(countResult[0]?.total) || 0,
                    page: pagination.page,
                    limit: pagination.limit,
                    pages: Math.ceil((Number(countResult[0]?.total) || 0) / pagination.limit),
                    clientType: companyType || null
               };
          } catch (error) {
               throw new Error(`Error fetching clients by type: ${error.message}`);
          }
     }

     static async createClient(data) {
          try {
               const companyType = normalizeCompanyType(data.client_type_id || data.client_type) || 'generalContractor';
               const isTemp = data.is_temp ? 1 : 0;
               const sql = `
                    INSERT INTO companies (company_name, website, office_number, company_type, address, description, status, is_temp)
                    VALUES (?, ?, ?, ?, ?, ?, 'active', ?)
               `;
               const [result] = await db.query(sql, [
                    data.company_name,
                    data.website || null,
                    data.office_number || null,
                    companyType,
                    data.address || null,
                    data.description || null,
                    isTemp
               ]);
               return result.insertId;
          } catch (error) {
               throw new Error(`Error creating client: ${error.message}`);
          }
     }

     static async createClientWithEmployee(data, userId, employee) {
          const connection = await db.getConnection();
          try {
               await connection.beginTransaction();

               const companyType = normalizeCompanyType(data.client_type_id || data.client_type) || 'generalContractor';
               const isTemp = data.is_temp ? 1 : 0;
               const [clientResult] = await connection.query(
                    `INSERT INTO companies (company_name, website, office_number, company_type, address, description, status, is_temp)
                     VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
                    [
                         data.company_name,
                         data.website || null,
                         data.office_number || null,
                         companyType,
                         data.address || null,
                         data.description || null,
                         isTemp
                    ]
               );

               const clientId = clientResult.insertId;
               let employeeId = null;

               if (employee) {
                    const roleValue = mapRoleToEnum(employee.designation || (employee.is_admin ? 'admin' : 'employee'));
                    const bcryptjs = require('bcryptjs');
                    const hashedPassword = employee.email ? await bcryptjs.hash(employee.email.trim().toLowerCase(), 10) : null;
                    const [employeeResult] = await connection.query(
                         `INSERT INTO employees (
                              company_id, first_name, last_name, phone, email, password, is_password_changed, role, is_admin, tag, status, created_by
                          )
                          VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, 'active', ?)`,
                         [
                              clientId,
                              employee.first_name,
                              employee.last_name || '',
                              employee.phone || null,
                              employee.email || null,
                              hashedPassword,
                              roleValue,
                              employee.is_admin ? 1 : 0,
                              employee.tag || null,
                              userId || null
                         ]
                    );
                    employeeId = employeeResult.insertId;
               }

               await connection.commit();

               if (employee && employee.email) {
                    const { sendWelcomeEmail } = require('../services/auth/welcomeMailer');
                    const roleType = companyType === 'vendor' ? 'vendor' : 'employee';
                    sendWelcomeEmail({
                         email: employee.email,
                         name: `${employee.first_name} ${employee.last_name || ''}`.trim(),
                         roleType: roleType
                    }).catch(err => console.warn(`Failed to send welcome email for client/vendor contact: ${err.message}`));
               }

               return { clientId, employeeId };
          } catch (error) {
               await connection.rollback();
               throw new Error(`Error creating client with employee: ${error.message}`);
          } finally {
               connection.release();
          }
     }

     static async updateClient(id, data) {
          try {
               const updateFields = [];
               const params = [];

               if (data.company_name !== undefined) {
                    updateFields.push('company_name = ?');
                    params.push(data.company_name);
               }
               if (data.website !== undefined) {
                    updateFields.push('website = ?');
                    params.push(data.website || null);
               }
               if (data.office_number !== undefined) {
                    updateFields.push('office_number = ?');
                    params.push(data.office_number || null);
               }
               if (data.address !== undefined) {
                    updateFields.push('address = ?');
                    params.push(data.address || null);
               }
               if (data.description !== undefined) {
                    updateFields.push('description = ?');
                    params.push(data.description || null);
               }

               const companyType = normalizeCompanyType(data.client_type_id || data.client_type);
               if (companyType && companyType !== 'steelmart') {
                    updateFields.push('company_type = ?');
                    params.push(companyType);
               }

               if (data.is_blocked !== undefined) {
                    updateFields.push('status = ?');
                    params.push(Number(data.is_blocked) === 1 ? 'blocked' : 'active');
               } else if (data.is_active !== undefined) {
                    updateFields.push('status = ?');
                    params.push(Number(data.is_active) === 1 ? 'active' : 'inactive');
               }

               if (updateFields.length === 0) {
                    return false;
               }

               params.push(id);
               const sql = `
                    UPDATE companies
                    SET ${updateFields.join(', ')}, updated_at = NOW()
                    WHERE id = ? AND company_type <> 'steelmart' AND status <> 'deleted'
               `;
               const [result] = await db.query(sql, params);
               return result.affectedRows > 0;
          } catch (error) {
               throw new Error(`Error updating client: ${error.message}`);
          }
     }

     static async deleteClient(id) {
          try {
               const [result] = await db.query(
                    `UPDATE companies
                     SET status = 'deleted', updated_at = NOW()
                     WHERE id = ? AND company_type <> 'steelmart' AND status <> 'deleted'`,
                    [id]
               );
               return result.affectedRows > 0;
          } catch (error) {
               throw new Error(`Error deleting client: ${error.message}`);
          }
     }

     static async unDeleteClient(id) {
          try {
               const [result] = await db.query(
                    `UPDATE companies
                     SET status = 'active', updated_at = NOW()
                     WHERE id = ? AND company_type <> 'steelmart' AND status = 'deleted'`,
                    [id]
               );
               return result.affectedRows > 0;
          } catch (error) {
               throw new Error(`Error restoring client: ${error.message}`);
          }
     }

     static async blockClient(id) {
          try {
               const [result] = await db.query(
                    `UPDATE companies
                     SET status = 'blocked', updated_at = NOW()
                     WHERE id = ? AND company_type <> 'steelmart' AND status <> 'blocked'`,
                    [id]
               );
               return result.affectedRows > 0;
          } catch (error) {
               throw new Error(`Error blocking client: ${error.message}`);
          }
     }

     static async unblockClient(id) {
          try {
               const [result] = await db.query(
                    `UPDATE companies
                     SET status = 'active', updated_at = NOW()
                     WHERE id = ? AND company_type <> 'steelmart' AND status = 'blocked'`,
                    [id]
               );
               return result.affectedRows > 0;
          } catch (error) {
               throw new Error(`Error unblocking client: ${error.message}`);
          }
     }

     static async getClientTypes() {
          return [
               {
                    id: COMPANY_TYPE_IDS.generalContractor,
                    type_name: 'generalContractor',
                    description: 'General contractor company'
               },
               {
                    id: COMPANY_TYPE_IDS.vendor,
                    type_name: 'vendor',
                    description: 'Vendor company'
               }
          ];
     }

     static async getEmployeeTags() {
          return ['detailing', 'engineering', 'design', 'dockersAndJoist', 'welding', 'erection', 'structural', 'cnc'];
     }

     static async searchClients(query) {
          try {
               const keyword = `%${String(query || '').trim()}%`;
               const sql = `
                    SELECT
                         ${companySelect},
                         COUNT(e.id) AS employee_count
                    FROM companies c
                    LEFT JOIN employees e
                         ON e.company_id = c.id
                         AND e.status <> 'deleted'
                    WHERE c.company_type <> 'steelmart'
                    AND c.status <> 'deleted'
                    AND c.is_temp = 0
                    AND (
                         c.company_name LIKE ? OR
                         c.website LIKE ? OR
                         c.office_number LIKE ?
                    )
                    GROUP BY c.id
                    ORDER BY c.company_name ASC, c.id ASC
               `;
               const [results] = await db.query(sql, [keyword, keyword, keyword]);
               return results;
          } catch (error) {
               throw new Error(`Error searching clients: ${error.message}`);
          }
     }
}

module.exports = ClientModel;