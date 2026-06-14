const db = require('../../config/db');
const { activeBidFilter } = require('../services/auth/accountStatus');
const { bidProjectId, bidSalesId, bidCrmId, bidCProjectId } = require('../../common/utils/bidProjectId');

const SALES_PIPELINE_STATUSES = ['bidinprogress', 'bid in progress', 'pending'];
const CRM_PIPELINE_STATUSES = ['senttoclient', 'sent to client', 'shared with client', 'client to respond', 'approved', 'won', 'lost'];
const CRM_ID_ELIGIBLE_STATUSES = new Set(CRM_PIPELINE_STATUSES);

const normalizeStatus = (status) => String(status || '').trim().toLowerCase();

class BidModel {
     static bidSchemaReady = false;

     static bidInfo(alias = 'b') {
          return `
               ${alias}.id,
               ${alias}.bid_sales_id,
               ${alias}.bid_crm_id,
               ${alias}.bid_project_id,
               ${alias}.project_name,
               ${alias}.address,
               ${alias}.due_date,
               ${alias}.drawing_date,
               ${alias}.drawing_description,
               ${alias}.db_wage_rate,
               ${alias}.db_wage_rate AS dbWageRate,
               ${alias}.tax_exempt AS taxExempt,
               ${alias}.fringes_amount,
               ${alias}.base_contact_amount AS base_contract_amount,
               ${alias}.base_contact_amount,
               COALESCE(pi.grand_total, 0) AS grand_total,
               COALESCE(pi.grand_total, 0) AS bid_value,
               COALESCE(pi.sub_total, 0) AS sub_total,
               ${alias}.bid_status AS status,
               ${alias}.send_to_company_ids AS send_to_ids,
               ${alias}.approved_by,
               ${alias}.scope_of_work,
               ${alias}.exclusion,
               ${alias}.access_notes,
               ${alias}.award_number,
               ${alias}.overhead,
               ${alias}.profit,
               ${alias}.last_follow_up_date,
               ${alias}.is_pinned,
               CASE
                    WHEN COALESCE(${alias}.project_status, 'active') = 'active'
                    AND COALESCE(${alias}.bid_status, 'bidInProgress') <> 'deleted'
                    THEN 1
                    ELSE 0
               END AS is_active,
               CASE
                    WHEN COALESCE(${alias}.project_status, 'active') = 'deleted'
                    OR COALESCE(${alias}.bid_status, 'bidInProgress') = 'deleted'
                    THEN 1
                    ELSE 0
               END AS is_deleted,
               CASE
                    WHEN COALESCE(${alias}.project_status, 'active') = 'archived'
                    THEN 1
                    ELSE 0
               END AS is_archived,
               ${alias}.project_status,
               ${alias}.created_by,
               ${alias}.updated_by,
               ${alias}.created_at,
               ${alias}.updated_at
          `;
     }

     static enrichBidCreatorFields(bids) {
          const bidList = Array.isArray(bids) ? bids : [];

          bidList.forEach((bid) => {
               if (!bid || typeof bid !== 'object') return;
               bid.created_by_id = bid.created_by;
               if (bid.created_by_name) {
                    bid.created_by = bid.created_by_name;
               }
          });

          return bidList;
     }

     static async ensureBidSchema() {
          this.bidSchemaReady = true;
     }

     static async getBidByProjectName(projectName) {
          try {
               await this.ensureBidSchema();
               const [rows] = await db.query(
                    `SELECT ${this.bidInfo('b')}
                     FROM projects b
                     LEFT JOIN project_invoices pi ON pi.project_id = b.id
                     WHERE LOWER(b.project_name) = ?
                     LIMIT 1`,
                    [String(projectName || '').toLowerCase()]
               );
               return rows[0];
          } catch (error) {
               throw new Error(`Error fetching projects by project name: ${error.message}`);
          }
     }

     static async getBidByProjectNameExceptId(projectName, bidId) {
          try {
               await this.ensureBidSchema();
               const [rows] = await db.query(
                    `SELECT ${this.bidInfo('b')}
                     FROM projects b
                     LEFT JOIN project_invoices pi ON pi.project_id = b.id
                     WHERE LOWER(b.project_name) = ? AND b.id != ?
                     LIMIT 1`,
                    [String(projectName || '').toLowerCase(), bidId]
               );
               return rows[0];
          } catch (error) {
               throw new Error(`Error checking duplicate bid project name: ${error.message}`);
          }
     }

     static async getBidRelations(bidIds) {
          const ids = Array.isArray(bidIds)
               ? bidIds.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0)
               : [];

          if (ids.length === 0) {
               return [];
          }

          const placeholders = ids.map(() => '?').join(', ');
          const relationSql = `
               SELECT
                    pce.project_id AS bid_id,
                    c.id AS client_id,
                    c.company_name AS client_name,
                    e.id AS employee_id,
                    e.first_name,
                    e.last_name,
                    e.email,
                    e.phone,
                    CASE WHEN e.is_admin = 1 THEN 'Admin' ELSE 'Employee' END AS designation,
                    e.is_admin,
                    c.company_type AS client_type,
                    e.tag
               FROM project_company_employees pce
               INNER JOIN employees e ON e.id = pce.company_employee_id
               INNER JOIN companies c ON c.id = e.company_id
               WHERE pce.project_id IN (${placeholders})
               AND c.status = 'active'
               AND e.status = 'active'
               ORDER BY c.company_name ASC, e.first_name ASC
          `;

          const [relations] = await db.query(relationSql, ids);
          return relations;
     }

     static attachClientsToBidCollection(bids, relations) {
          const relationMap = new Map();

          relations.forEach((row) => {
               if (!relationMap.has(row.bid_id)) {
                    relationMap.set(row.bid_id, new Map());
               }

               const clientMap = relationMap.get(row.bid_id);
               if (!clientMap.has(row.client_id)) {
                    clientMap.set(row.client_id, {
                         client_id: row.client_id,
                         client_name: row.client_name,
                         client_type: row.client_type,
                         employees: []
                    });
               }

               clientMap.get(row.client_id).employees.push({
                    employee_id: row.employee_id,
                    first_name: row.first_name,
                    last_name: row.last_name,
                    full_name: `${row.first_name} ${row.last_name || ''}`.trim(),
                    phone: row.phone,
                    email: row.email,
                    designation: row.designation,
                    is_admin: row.is_admin
               });
          });

          bids.forEach((bid) => {
               const clientMap = relationMap.get(bid.id);
               let clients = clientMap ? Array.from(clientMap.values()) : [];
               // If a bid has a specific `send_to` client (estimate was shared),
               // only include that client in the clients list for CRM views.
               // This prevents showing all associated clients when an estimate
               // was only shared with a subset.
               try {
                    const sendToIdsStr = bid?.send_to_ids || (bid?.send_to ? String(bid.send_to) : null);
                    if (sendToIdsStr && clients.length > 0) {
                         const sendToIds = String(sendToIdsStr).split(',').map(Number);
                         const filtered = clients.filter((c) => sendToIds.includes(Number(c.client_id)));
                         if (filtered.length > 0) {
                              clients = filtered;
                         }
                    }
               } catch (err) {
                    // noop - if parsing fails, fall back to full clients list
               }
               bid.clients = clients.filter((c) => c.client_type !== 'steelmart' && c.client_type !== 'vendor');
               bid.vendor_employees = relations
                    .filter((row) => row.bid_id === bid.id && row.client_type === 'vendor')
                    .map((row) => ({
                         employee_id: row.employee_id,
                         id: row.employee_id,
                         first_name: row.first_name,
                         last_name: row.last_name,
                         full_name: `${row.first_name} ${row.last_name || ''}`.trim(),
                         phone: row.phone,
                         email: row.email,
                         designation: row.tag || row.designation,
                         tag: row.tag || null,
                         is_admin: row.is_admin,
                         client_id: row.client_id,
                         vendor_id: row.client_id,
                         vendor_name: row.client_name
                    }));
          });
     }

     static async getBidById(bidId) {
          try {
               await this.ensureBidSchema();
               const [rows] = await db.query(
                    `SELECT ${this.bidInfo('b')},
                            CONCAT_WS(' ', u.first_name, u.last_name) AS created_by_name
                     FROM projects b
                     LEFT JOIN project_invoices pi ON pi.project_id = b.id
                     LEFT JOIN employees u ON u.id = b.created_by
                     WHERE b.id = ?
                     AND COALESCE(b.project_status, 'active') IN ('active', 'archived', 'completed')
                     AND COALESCE(b.bid_status, 'bidInProgress') <> 'deleted'
                     LIMIT 1`,
                    [bidId]
               );
               const bid = rows[0];
               if (!bid) {
                    return null;
               }

               this.enrichBidCreatorFields([bid]);
               const relations = await this.getBidRelations([bidId]);
               this.attachClientsToBidCollection([bid], relations);

               const PersonnelTeamModel = require('./personnelTeamModel');
               const teams = await PersonnelTeamModel.getTeamsByProjectId(bidId);
               bid.teams = teams;

               return bid;
          } catch (error) {
               throw new Error(`Error fetching bid details: ${error.message}`);
          }
     }

     static async getBidClients(clientIds) {
          try {
               const ids = Array.isArray(clientIds)
                    ? clientIds.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0)
                    : [];

               if (ids.length === 0) return [];

               const uniqueIds = Array.from(new Set(ids));
               const placeholders = uniqueIds.map(() => '?').join(', ');
               const [rows] = await db.query(
                    `SELECT c.id
                     FROM companies c
                     WHERE c.id IN (${placeholders})
                     AND c.company_type <> 'steelmart'
                     AND c.company_type <> 'vendor'
                     AND c.status = 'active'`,
                    uniqueIds
               );
               return rows;
          } catch (error) {
               throw new Error(`Error fetching clients: ${error.message}`);
          }
     }

     static async getBidClientEmployees(clientEmployeeIds, clientId = null) {
          try {
               const ids = Array.isArray(clientEmployeeIds)
                    ? clientEmployeeIds.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0)
                    : [];

               if (ids.length === 0) return [];

               const uniqueIds = Array.from(new Set(ids));
               const placeholders = uniqueIds.map(() => '?').join(', ');
               let sql = `
                    SELECT e.id, e.company_id AS client_id
                    FROM employees e
                    INNER JOIN companies c ON c.id = e.company_id
                    WHERE e.id IN (${placeholders})
                    AND e.status = 'active'
                    AND c.status = 'active'
                    AND c.company_type <> 'steelmart'
                    AND c.company_type <> 'vendor'
               `;
               const params = [...uniqueIds];

               if (clientId !== null && clientId !== undefined) {
                    sql += ' AND e.company_id = ?';
                    params.push(Number(clientId));
               }

               const [rows] = await db.query(sql, params);
               return rows;
          } catch (error) {
               throw new Error(`Error fetching client employees: ${error.message}`);
          }
     }

     static async getBidEmployees(employeeIds) {
          try {
               const ids = Array.isArray(employeeIds)
                    ? employeeIds.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0)
                    : [];

               if (ids.length === 0) return [];

               const uniqueIds = Array.from(new Set(ids));
               const placeholders = uniqueIds.map(() => '?').join(', ');
               let sql = `
                    SELECT e.id, e.company_id AS client_id
                    FROM employees e
                    INNER JOIN companies c ON c.id = e.company_id
                    WHERE e.id IN (${placeholders})
                    AND e.status = 'active'
                    AND c.status = 'active'
                    AND c.company_type = 'vendor'
               `;
               const [rows] = await db.query(sql, uniqueIds);
               return rows;
          } catch (error) {
               throw new Error(`Error fetching bid employees: ${error.message}`);
          }
     }

     static buildBidFilters({ search, clientId, clientIds, client_ids, status, pipeline, isPinned, projectScope, startDate, endDate }) {
          const filters = [];
          const params = [];
          const useDeletedStatus = normalizeStatus(status) === 'deleted';
          const useArchivedStatus = normalizeStatus(status) === 'archived';
          const normalizedPipeline = normalizeStatus(pipeline);
          const normalizedProjectScope = normalizeStatus(projectScope);

          const useCompletedStatus = normalizeStatus(status) === 'completed';

          if (useDeletedStatus) {
               filters.push(`(COALESCE(b.project_status, 'active') = 'deleted' OR LOWER(COALESCE(b.bid_status, '')) = 'deleted')`);
          } else if (useArchivedStatus) {
               filters.push(`COALESCE(b.project_status, 'active') = 'archived'`);
          } else if (useCompletedStatus) {
               filters.push(`COALESCE(b.project_status, 'active') = 'completed'`);
          } else {
               filters.push(`(COALESCE(b.project_status, 'active') <> 'deleted' AND COALESCE(b.bid_status, 'bidInProgress') <> 'deleted' AND COALESCE(b.project_status, 'active') <> 'archived' AND COALESCE(b.project_status, 'active') <> 'completed')`);
          }

          if (startDate) {
               filters.push('b.due_date >= ?');
               params.push(startDate);
          }
          if (endDate) {
               filters.push('b.due_date <= ?');
               params.push(endDate);
          }

          if (normalizedPipeline === 'sales') {
               if (useDeletedStatus) {
                    filters.push('b.send_to_company_ids IS NULL');
               } else {
                    const placeholders = SALES_PIPELINE_STATUSES.map(() => '?').join(', ');
                    filters.push(`LOWER(COALESCE(b.bid_status, '')) IN (${placeholders})`);
                    params.push(...SALES_PIPELINE_STATUSES);
               }
          } else if (normalizedPipeline === 'crm') {
               if (useDeletedStatus) {
                    filters.push('b.send_to_company_ids IS NOT NULL');
               } else {
                    let targetStatuses = [...CRM_PIPELINE_STATUSES];
                    if (!status || normalizeStatus(status) === 'all' || normalizeStatus(status) === 'all bids') {
                         targetStatuses = targetStatuses.filter(s => s !== 'lost');
                    }
                    const placeholders = targetStatuses.map(() => '?').join(', ');
                    filters.push(`LOWER(COALESCE(b.bid_status, '')) IN (${placeholders})`);
                    params.push(...targetStatuses);
               }
          }

          if (search) {
               const keyword = `%${search}%`;
               filters.push(`
                    (
                         b.project_name LIKE ? OR
                         b.address LIKE ? OR
                         DATE_FORMAT(b.due_date, '%Y-%m-%d') LIKE ? OR
                         LOWER(COALESCE(b.bid_status, '')) LIKE LOWER(?) OR
                         EXISTS (
                              SELECT 1
                              FROM project_company_employees pce_search
                              INNER JOIN employees e_search ON e_search.id = pce_search.company_employee_id
                              INNER JOIN companies c_search ON c_search.id = e_search.company_id
                              WHERE pce_search.project_id = b.id
                              AND c_search.company_name LIKE ?
                         )
                    )
               `);
               params.push(keyword, keyword, keyword, keyword, keyword);
          }

          const resolvedClientIds = clientIds !== undefined ? clientIds : client_ids;
          const clientFilterValue = resolvedClientIds !== undefined && resolvedClientIds !== null && resolvedClientIds !== ''
               ? resolvedClientIds
               : clientId;

          if (clientFilterValue) {
               const ids = Array.isArray(clientFilterValue)
                    ? clientFilterValue.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0)
                    : String(clientFilterValue)
                         .split(',')
                         .map((id) => Number(id.trim()))
                         .filter((id) => Number.isInteger(id) && id > 0);

               if (ids.length > 0) {
                    const uniqueIds = Array.from(new Set(ids));
                    const placeholders = uniqueIds.map(() => '?').join(', ');
                    filters.push(`
                         EXISTS (
                              SELECT 1
                              FROM project_company_employees pce_client
                              INNER JOIN employees e_client ON e_client.id = pce_client.company_employee_id
                              WHERE pce_client.project_id = b.id
                              AND e_client.company_id IN (${placeholders})
                         )
                    `);
                    params.push(...uniqueIds);
               }
          }

          if (status && !useDeletedStatus && !useArchivedStatus && !useCompletedStatus) {
               let normalizedBidStatus = normalizeStatus(status);
               if (normalizedBidStatus === 'overdue') {
                    filters.push('b.due_date < CURDATE()');
               } else if (normalizedBidStatus !== 'all' && normalizedBidStatus !== 'all bids') {
                    if (normalizedBidStatus === 'bid in progress') normalizedBidStatus = 'bidinprogress';
                    if (normalizedBidStatus === 'sent to client' || normalizedBidStatus === 'shared with client' || normalizedBidStatus === 'client to respond') normalizedBidStatus = 'senttoclient';
                    if (normalizedBidStatus === 'bidinprogress') {
                         filters.push('LOWER(COALESCE(b.bid_status, \'\')) IN (?, ?)');
                         params.push('bidinprogress', 'approved');
                    } else {
                         filters.push('LOWER(COALESCE(b.bid_status, \'\')) = ?');
                         params.push(normalizedBidStatus);
                    }
               }
          }

          if (normalizedProjectScope === 'won' && !useDeletedStatus) {
               filters.push(`LOWER(COALESCE(b.bid_status, '')) = 'won'`);
          }

          if (isPinned !== undefined && isPinned !== null) {
               const pinValue = String(isPinned).trim().toLowerCase();
               if (pinValue === '1' || pinValue === 'true') {
                    filters.push('b.is_pinned = 1');
               } else if (pinValue === '0' || pinValue === 'false') {
                    filters.push('b.is_pinned = 0');
               }
          }

          return {
               whereSql: filters.length > 0 ? filters.join(' AND ') : '1=1',
               params
          };
     }

     static async getBidStatusCounts({ search = '', clientId = '', clientIds = '', client_ids = '', pipeline = '', isPinned = undefined, projectScope = '', startDate = '', endDate = '' }) {
          try {
               const resolvedClientIds = clientIds || client_ids || clientId;
               const { whereSql, params } = this.buildBidFilters({ search, clientIds: resolvedClientIds, pipeline, isPinned, projectScope, startDate, endDate });
               const [rows] = await db.query(
                    `SELECT LOWER(COALESCE(b.bid_status, '')) AS status, COUNT(DISTINCT b.id) AS total
                     FROM projects b
                     WHERE ${whereSql}
                     GROUP BY LOWER(COALESCE(b.bid_status, ''))`,
                    params
               );

               const counts = {
                    approved: 0,
                    bidinprogress: 0,
                    sentToClient: 0,
                    lost: 0,
                    won: 0,
                    archived: 0,
                    deleted: 0,
                    completed: 0
               };

               rows.forEach((row) => {
                    let statusKey = row.status;
                    if (statusKey === 'senttoclient') statusKey = 'sentToClient';
                    if (counts[statusKey] !== undefined) {
                         counts[statusKey] = Number(row.total) || 0;
                    }
               });

               const { whereSql: overdueWhere, params: overdueParams } = this.buildBidFilters({ search, clientIds: resolvedClientIds, status: 'overdue', pipeline, projectScope, startDate, endDate });
               const [overdueRows] = await db.query(
                    `SELECT COUNT(DISTINCT b.id) AS total
                     FROM projects b
                     WHERE ${overdueWhere}`,
                    overdueParams
               );
               counts.overdue = Number(overdueRows[0]?.total) || 0;

               const { whereSql: archivedWhere, params: archivedParams } = this.buildBidFilters({ search, clientIds: resolvedClientIds, status: 'archived', pipeline, projectScope, startDate, endDate });
               const [archivedRows] = await db.query(
                    `SELECT COUNT(DISTINCT b.id) AS total
                     FROM projects b
                     WHERE ${archivedWhere}`,
                    archivedParams
               );
               counts.archived = Number(archivedRows[0]?.total) || 0;

               const { whereSql: completedWhere, params: completedParams } = this.buildBidFilters({ search, clientIds: resolvedClientIds, status: 'completed', pipeline, projectScope, startDate, endDate });
               const [completedRows] = await db.query(
                    `SELECT COUNT(DISTINCT b.id) AS total
                     FROM projects b
                     WHERE ${completedWhere}`,
                    completedParams
               );
               counts.completed = Number(completedRows[0]?.total) || 0;

               const { whereSql: allWhere, params: allParams } = this.buildBidFilters({ search, clientIds: resolvedClientIds, status: 'all', pipeline, projectScope, startDate, endDate });
               const [allRows] = await db.query(
                    `SELECT COUNT(DISTINCT b.id) AS total
                     FROM projects b
                     WHERE ${allWhere}`,
                    allParams
               );
               counts.all = Number(allRows[0]?.total) || 0;

               return counts;
          } catch (error) {
               throw new Error(`Error fetching bid status counts: ${error.message}`);
          }
     }

     static async getBids({ search = '', status = '', clientId = '', clientIds = '', client_ids = '', page = 1, limit = 5, pipeline = '', isPinned = undefined, projectScope = '', startDate = '', endDate = '' }) {
          try {
               await this.ensureBidSchema();
               const offset = (page - 1) * limit;
               const resolvedClientIds = clientIds || client_ids || clientId;
               const { whereSql, params } = this.buildBidFilters({ search, status, clientIds: resolvedClientIds, pipeline, isPinned, projectScope, startDate, endDate });

               const [countRows] = await db.query(
                    `SELECT COUNT(DISTINCT b.id) AS totalRecords
                     FROM projects b
                     WHERE ${whereSql}`,
                    params
               );

               const [bids] = await db.query(
                    `SELECT ${this.bidInfo('b')},
                            CONCAT_WS(' ', u.first_name, u.last_name) AS created_by_name
                     FROM projects b
                     LEFT JOIN project_invoices pi ON pi.project_id = b.id
                     LEFT JOIN employees u ON u.id = b.created_by
                     WHERE ${whereSql}
                     ORDER BY b.created_at DESC, b.id DESC
                     LIMIT ? OFFSET ?`,
                    [...params, limit, offset]
               );

               this.enrichBidCreatorFields(bids);
               const relations = await this.getBidRelations(bids.map((bid) => bid.id));
               this.attachClientsToBidCollection(bids, relations);

               const statusCounts = await this.getBidStatusCounts({ search, clientIds: resolvedClientIds, pipeline, isPinned, projectScope, startDate, endDate });

               return {
                    bids,
                    totalRecords: Number(countRows[0]?.totalRecords) || 0,
                    statusCounts
               };
          } catch (error) {
               throw new Error(`Error fetching projects: ${error.message}`);
          }
     }

     static mapProjectFields(bidFields) {
          const projectFields = { ...bidFields };

          if (projectFields.status !== undefined) {
               projectFields.bid_status = projectFields.status;
               delete projectFields.status;
          }

          if (projectFields.send_to_ids !== undefined) {
               projectFields.send_to_company_ids = projectFields.send_to_ids;
               delete projectFields.send_to_ids;
          }

          if (projectFields.base_contract_amount !== undefined) {
               projectFields.base_contact_amount = projectFields.base_contract_amount;
               delete projectFields.base_contract_amount;
          }

          if (projectFields.bid_status !== undefined && projectFields.project_status === undefined) {
               projectFields.project_status = normalizeStatus(projectFields.bid_status) === 'deleted' ? 'deleted' : 'active';
          }

          return projectFields;
     }

     static async getEmployeeCompanyId(connection, employeeId, companyTypeFilter = null) {
          let sql = `
               SELECT e.company_id
               FROM employees e
               INNER JOIN companies c ON c.id = e.company_id
               WHERE e.id = ?
               AND e.status = 'active'
               AND c.status = 'active'
          `;
          const params = [employeeId];

          if (companyTypeFilter === 'steelmart') {
               sql += ` AND c.company_type = 'steelmart'`;
          } else if (companyTypeFilter === 'vendor') {
               sql += ` AND c.company_type = 'vendor'`;
          } else if (companyTypeFilter === 'non-vendor') {
               sql += ` AND c.company_type <> 'vendor' AND c.company_type <> 'steelmart'`;
          } else {
               sql += ` AND c.company_type <> 'steelmart'`;
          }

          const [rows] = await connection.query(sql, params);
          return rows[0]?.company_id || null;
     }

     static async insertProjectEmployees(connection, projectId, employeeIds, allowedCompanyIds = null, companyTypeFilter = null) {
          for (const rawEmployeeId of employeeIds || []) {
               const employeeId = Number(rawEmployeeId);
               if (!Number.isInteger(employeeId) || employeeId <= 0) {
                    continue;
               }

               const companyId = await this.getEmployeeCompanyId(connection, employeeId, companyTypeFilter);
               if (!companyId) {
                    continue;
               }

               if (Array.isArray(allowedCompanyIds) && allowedCompanyIds.length > 0 && !allowedCompanyIds.includes(Number(companyId))) {
                    continue;
               }

               await connection.query(
                    `INSERT INTO project_company_employees (project_id, company_employee_id)
                     VALUES (?, ?)
                     ON DUPLICATE KEY UPDATE updated_at = NOW()`,
                    [projectId, employeeId]
               );
          }
     }

     static async autoInviteVendorsFromPersonnel(connection, projectId, vendorEmployeeIds) {
          if (!Array.isArray(vendorEmployeeIds) || vendorEmployeeIds.length === 0) return;

          const employeeIds = vendorEmployeeIds
               .map((item) => typeof item === 'object' ? Number(item.client_employee_id || item.employee_id || item.id) : Number(item))
               .filter((id) => Number.isInteger(id) && id > 0);

          if (employeeIds.length === 0) return;

          const placeholders = employeeIds.map(() => '?').join(', ');
          const [companyRows] = await connection.query(
               `SELECT DISTINCT e.company_id
                FROM employees e
                INNER JOIN companies c ON c.id = e.company_id
                WHERE e.id IN (${placeholders})
                AND c.company_type = 'vendor'
                AND c.status = 'active'
                AND e.status = 'active'`,
               employeeIds
          );

          for (const row of companyRows) {
               await connection.query(
                    `INSERT INTO project_vendors (project_id, vendor_company_id, status, created_at, updated_at)
                     VALUES (?, ?, 'invited', NOW(), NOW())
                     ON DUPLICATE KEY UPDATE updated_at = NOW()`,
                    [projectId, row.company_id]
               );
          }
     }

     static async createBid(bidData) {
          await this.ensureBidSchema();
          const connection = await db.getConnection();
          try {
               await connection.beginTransaction();

               const {
                    client_ids: rawClientIds,
                    client_id: legacyClientIds,
                    client_employee_ids: rawClientEmployeeIds,
                    client_employee_id: legacyClientEmployeeIds,
                    vendor_employee_ids: rawVendorEmployeeIds,
                    vendor_employees: rawVendorEmployees,
                    grand_total: rawGrandTotal,
                    bid_value: rawBidValue,
                    ...bidFields
               } = bidData;

               const clientIds = Array.isArray(rawClientIds) ? rawClientIds : legacyClientIds;
               const clientEmployeeIds = Array.isArray(rawClientEmployeeIds) ? rawClientEmployeeIds : legacyClientEmployeeIds;
               const vendorEmployeeIds = Array.isArray(rawVendorEmployeeIds) ? rawVendorEmployeeIds : rawVendorEmployees;
               const grandTotal = rawGrandTotal !== undefined ? rawGrandTotal : rawBidValue;
               const projectFields = this.mapProjectFields(bidFields);

               const [result] = await connection.query('INSERT INTO projects SET ?, created_at = NOW(), updated_at = NOW()', [projectFields]);
               const projectId = result.insertId;

               const generatedBidSalesId = bidSalesId(projectId);
               await connection.query(
                    'UPDATE projects SET bid_sales_id = ?, bid_project_id = NULL WHERE id = ?',
                    [generatedBidSalesId, projectId]
               );

               if (grandTotal !== undefined && grandTotal !== null) {
                    await connection.query(
                         `INSERT INTO project_invoices (project_id, sub_total, grand_total, created_by, updated_by, created_at, updated_at)
                          VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
                         [projectId, grandTotal, grandTotal, bidData.created_by || null, bidData.created_by || null]
                    );
               }

               await this.insertProjectEmployees(connection, projectId, clientEmployeeIds, Array.isArray(clientIds) ? clientIds.map(Number) : null, 'non-vendor');

               if (Array.isArray(vendorEmployeeIds) && vendorEmployeeIds.length > 0) {
                    const normalizedVendorEmployeeIds = vendorEmployeeIds.map((item) =>
                         typeof item === 'object'
                              ? Number(item.client_employee_id || item.employee_id || item.id)
                              : Number(item)
                    );
                    await this.insertProjectEmployees(connection, projectId, normalizedVendorEmployeeIds, null, 'vendor');
                    await this.autoInviteVendorsFromPersonnel(connection, projectId, vendorEmployeeIds);
               }

               // Assign PRJ prefix if status is won
               const normalizedBidStatus = normalizeStatus(projectFields.bid_status);
               if (normalizedBidStatus === 'won') {
                    const prjId = bidCProjectId(projectId);
                    await connection.query('UPDATE projects SET bid_project_id = ?, updated_at = NOW() WHERE id = ?', [prjId, projectId]);
               }

               await connection.commit();
               return projectId;
          } catch (error) {
               await connection.rollback();
               throw new Error(`Error creating bid: ${error.message}`);
          } finally {
               connection.release();
          }
     }

     static async updateBid(bidId, bidData) {
          await this.ensureBidSchema();
          const connection = await db.getConnection();
          try {
               await connection.beginTransaction();

               const {
                    client_ids: rawClientIds,
                    client_id: legacyClientIds,
                    client_employee_ids: rawClientEmployeeIds,
                    client_employee_id: legacyClientEmployeeIds,
                    vendor_employee_ids: rawVendorEmployeeIds,
                    vendor_employees: rawVendorEmployees,
                    grand_total: rawGrandTotal,
                    bid_value: rawBidValue,
                    ...bidFields
               } = bidData;

               const clientIds = Array.isArray(rawClientIds) ? rawClientIds : legacyClientIds;
               const clientEmployeeIds = Array.isArray(rawClientEmployeeIds) ? rawClientEmployeeIds : legacyClientEmployeeIds;
               const vendorEmployeeIds = Array.isArray(rawVendorEmployeeIds) ? rawVendorEmployeeIds : rawVendorEmployees;
               const grandTotal = rawGrandTotal !== undefined ? rawGrandTotal : rawBidValue;
               const projectFields = this.mapProjectFields(bidFields);

               if (Object.keys(projectFields).length > 0) {
                    await connection.query('UPDATE projects SET ?, updated_at = NOW() WHERE id = ?', [projectFields, bidId]);
               }

               if (grandTotal !== undefined && grandTotal !== null) {
                    const [invoiceRows] = await connection.query(
                         `SELECT id FROM project_invoices WHERE project_id = ? ORDER BY id ASC LIMIT 1 FOR UPDATE`,
                         [bidId]
                    );
                    const invoiceId = invoiceRows[0]?.id || null;
                    if (invoiceId) {
                         await connection.query(
                              `UPDATE project_invoices
                               SET sub_total = ?, grand_total = ?, updated_by = ?, updated_at = NOW()
                               WHERE id = ?`,
                              [grandTotal, grandTotal, bidData.updated_by || null, invoiceId]
                         );
                    } else {
                         await connection.query(
                              `INSERT INTO project_invoices (project_id, sub_total, grand_total, created_by, updated_by, created_at, updated_at)
                               VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
                              [bidId, grandTotal, grandTotal, bidData.updated_by || null, bidData.updated_by || null]
                         );
                    }
               }

               const [existingSalesRows] = await connection.query('SELECT bid_sales_id FROM projects WHERE id = ? FOR UPDATE', [bidId]);
               const existingBidSalesId = existingSalesRows[0]?.bid_sales_id || null;
               if (!existingBidSalesId) {
                    const salesId = bidSalesId(bidId);
                    await connection.query('UPDATE projects SET bid_sales_id = ?, updated_at = NOW() WHERE id = ?', [salesId, bidId]);
               }

               const normalizedBidStatus = normalizeStatus(projectFields.bid_status);
               const shouldAssignCrmId = (
                    projectFields.send_to_company_ids !== undefined
                    || CRM_ID_ELIGIBLE_STATUSES.has(normalizedBidStatus)
               ) && normalizedBidStatus !== 'deleted';

               if (shouldAssignCrmId) {
                    const [existingCrmRows] = await connection.query('SELECT bid_crm_id FROM projects WHERE id = ? FOR UPDATE', [bidId]);
                    const existingBidCrmId = existingCrmRows[0]?.bid_crm_id || null;
                    if (!existingBidCrmId) {
                         const crmId = bidCrmId(bidId);
                         await connection.query('UPDATE projects SET bid_crm_id = ?, updated_at = NOW() WHERE id = ?', [crmId, bidId]);
                    }
               }

               if (clientEmployeeIds !== undefined) {
                    await connection.query(
                         `DELETE pce
                          FROM project_company_employees pce
                          INNER JOIN employees e ON e.id = pce.company_employee_id
                          INNER JOIN companies c ON c.id = e.company_id
                          WHERE pce.project_id = ?
                          AND c.company_type <> 'vendor'
                          AND c.company_type <> 'steelmart'`,
                         [bidId]
                    );

                    await this.insertProjectEmployees(
                         connection,
                         bidId,
                         clientEmployeeIds,
                         Array.isArray(clientIds) ? clientIds.map(Number) : null,
                         'non-vendor'
                    );
               }

               if (vendorEmployeeIds !== undefined) {
                    await connection.query(
                         `DELETE pce
                          FROM project_company_employees pce
                          INNER JOIN employees e ON e.id = pce.company_employee_id
                          INNER JOIN companies c ON c.id = e.company_id
                          WHERE pce.project_id = ?
                          AND c.company_type = 'vendor'`,
                         [bidId]
                    );

                    const normalizedVendorEmployeeIds = Array.isArray(vendorEmployeeIds)
                         ? vendorEmployeeIds.map((item) =>
                              typeof item === 'object'
                                   ? Number(item.client_employee_id || item.employee_id || item.id)
                                   : Number(item)
                         )
                         : [];
                    await this.insertProjectEmployees(connection, bidId, normalizedVendorEmployeeIds, null, 'vendor');
                    await this.autoInviteVendorsFromPersonnel(connection, bidId, vendorEmployeeIds);
               }

               // Always assign PRJ prefix when status changes to won
               if (projectFields.bid_status !== undefined && normalizeStatus(projectFields.bid_status) === 'won') {
                    const [existingRows2] = await connection.query('SELECT bid_project_id FROM projects WHERE id = ? FOR UPDATE', [bidId]);
                    const existingBidProjectId2 = existingRows2[0]?.bid_project_id || null;
                    if (!existingBidProjectId2 || String(existingBidProjectId2).toUpperCase().startsWith('BID-')) {
                         const projectId2 = bidCProjectId(bidId);
                         await connection.query('UPDATE projects SET bid_project_id = ?, updated_at = NOW() WHERE id = ?', [projectId2, bidId]);
                    }
               }

               await connection.commit();
               return true;
          } catch (error) {
               await connection.rollback();
               throw new Error(`Error updating bid: ${error.message}`);
          } finally {
               connection.release();
          }
     }

     static async archiveBid(bidId) {
          try {
               const [result] = await db.query(
                    `UPDATE projects
                     SET project_status = 'archived', updated_at = NOW()
                     WHERE id = ?`,
                    [bidId]
               );
               return result.affectedRows > 0;
          } catch (error) {
               throw new Error(`Error archiving bid: ${error.message}`);
          }
     }

     static async unarchiveBid(bidId) {
          try {
               const [result] = await db.query(
                    `UPDATE projects
                     SET project_status = 'active', updated_at = NOW()
                     WHERE id = ?`,
                    [bidId]
               );
               return result.affectedRows > 0;
          } catch (error) {
               throw new Error(`Error unarchiving bid: ${error.message}`);
          }
     }

     static async deleteBid(bidId) {
          try {
               const [result] = await db.query(
                    `UPDATE projects
                     SET project_status = 'deleted', bid_status = 'deleted', updated_at = NOW()
                     WHERE id = ?`,
                    [bidId]
               );
               return result.affectedRows > 0;
          } catch (error) {
               throw new Error(`Error deleting bid: ${error.message}`);
          }
     }


     static async pinBid(bidId) {
          try {
               const [result] = await db.query(
                    `UPDATE projects
                     SET is_pinned = 1, updated_at = NOW()
                     WHERE id = ? AND is_pinned = 0`,
                    [bidId]
               );
               return result.affectedRows > 0;
          } catch (error) {
               throw new Error(`Error pinning bid: ${error.message}`);
          }
     }

     static async unpinBid(bidId) {
          try {
               const [result] = await db.query(
                    `UPDATE projects
                     SET is_pinned = 0, updated_at = NOW()
                     WHERE id = ? AND is_pinned = 1`,
                    [bidId]
               );
               return result.affectedRows > 0;
          } catch (error) {
               throw new Error(`Error unpinning bid: ${error.message}`);
          }
     }

     static async getDueSoonBids({ page = 1, limit = 10 }) {
          try {
               await this.ensureBidSchema();
               const offset = (page - 1) * limit;

               // Only active projects (not archived or deleted) with future or current due dates
               const whereSql = `
                    COALESCE(b.project_status, 'active') <> 'deleted' 
                    AND COALESCE(b.bid_status, 'bidInProgress') <> 'deleted' 
                    AND COALESCE(b.project_status, 'active') <> 'archived'
                    AND COALESCE(b.project_status, 'active') <> 'completed'
                    AND b.due_date >= CURDATE()
               `;

               const [countRows] = await db.query(
                    `SELECT COUNT(DISTINCT b.id) AS totalRecords
                     FROM projects b
                     WHERE ${whereSql}`
               );

               const [bids] = await db.query(
                    `SELECT ${this.bidInfo('b')},
                            CONCAT_WS(' ', u.first_name, u.last_name) AS created_by_name
                     FROM projects b
                     LEFT JOIN project_invoices pi ON pi.project_id = b.id
                     LEFT JOIN employees u ON u.id = b.created_by
                     WHERE ${whereSql}
                     ORDER BY b.due_date ASC, b.id DESC
                     LIMIT ? OFFSET ?`,
                    [limit, offset]
               );

               this.enrichBidCreatorFields(bids);
               const relations = await this.getBidRelations(bids.map((bid) => bid.id));
               this.attachClientsToBidCollection(bids, relations);

               return {
                    bids,
                    totalRecords: Number(countRows[0]?.totalRecords) || 0
               };
          } catch (error) {
               throw new Error(`Error fetching due soon projects: ${error.message}`);
          }
     }
}

module.exports = BidModel;
