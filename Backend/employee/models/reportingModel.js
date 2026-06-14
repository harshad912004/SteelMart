const db = require('../../config/db');
const { normalizePagination } = require('../../common/utils/pagination');

const CLOSED_OR_SENT_STATUSES = ['sentToClient', 'approved', 'lost', 'won'];
const CRM_REPORT_STATUSES = ['senttoclient', 'sent to client', 'shared with client', 'client to respond', 'approved', 'won', 'lost'];

const normalizeStatusList = (statuses) => statuses.map(() => '?').join(', ');

class ReportingModel {
     static buildDateFilter(filter = 'all') {
          const normalized = String(filter || 'all').trim().toLowerCase();

          if (normalized === 'week' || normalized === 'thisweek' || normalized === 'this_week') {
               return {
                    sql: ' AND b.created_at >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) AND b.created_at < DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 7 DAY)',
                    params: []
               };
          }

          if (normalized === 'month' || normalized === 'thismonth' || normalized === 'this_month') {
               return {
                    sql: ' AND b.created_at >= DATE_FORMAT(CURDATE(), "%Y-%m-01")',
                    params: []
               };
          }

          if (normalized === 'year' || normalized === 'thisyear' || normalized === 'this_year') {
               return {
                    sql: ' AND b.created_at >= MAKEDATE(YEAR(CURDATE()), 1)',
                    params: []
               };
          }

          return { sql: '', params: [] };
     }

     static buildDateCondition(filter = 'all', alias = 'b') {
          const normalized = String(filter || 'all').trim().toLowerCase();

          if (normalized === 'week' || normalized === 'thisweek' || normalized === 'this_week') {
               return `${alias}.created_at >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) AND ${alias}.created_at < DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 7 DAY)`;
          }

          if (normalized === 'month' || normalized === 'thismonth' || normalized === 'this_month') {
               return `${alias}.created_at >= DATE_FORMAT(CURDATE(), "%Y-%m-01")`;
          }

          if (normalized === 'year' || normalized === 'thisyear' || normalized === 'this_year') {
               return `${alias}.created_at >= MAKEDATE(YEAR(CURDATE()), 1)`;
          }

          return '1 = 1';
     }

     static activeProjectFilter(alias = 'b') {
          return `COALESCE(${alias}.project_status, 'active') = 'active' AND COALESCE(${alias}.bid_status, 'bidInProgress') <> 'deleted'`;
     }

     static async getDashboardSummary({ filter = 'all', hours = null } = {}) {
          try {
               const dateFilter = this.buildDateFilter(filter);
               const sentPlaceholders = normalizeStatusList(CLOSED_OR_SENT_STATUSES);
               const amountExpression = 'COALESCE(invoice_totals.grand_total, 0)';

               const summarySql = `
                    SELECT
                         COUNT(*) AS total_bids,
                         SUM(CASE WHEN b.bid_status IN (${sentPlaceholders}) THEN 1 ELSE 0 END) AS total_bids_sent,
                         SUM(CASE WHEN b.bid_status IN (${sentPlaceholders}) THEN ${amountExpression} ELSE 0 END) AS bids_sent_value,
                         SUM(CASE WHEN b.bid_status = 'won' THEN 1 ELSE 0 END) AS jobs_won,
                         SUM(CASE WHEN b.bid_status = 'won' THEN ${amountExpression} ELSE 0 END) AS bids_won_value,
                         SUM(CASE WHEN b.bid_status = 'lost' THEN 1 ELSE 0 END) AS jobs_lost,
                         SUM(CASE WHEN b.bid_status = 'lost' THEN ${amountExpression} ELSE 0 END) AS jobs_lost_value,
                         SUM(CASE WHEN b.bid_status = 'approved' THEN 1 ELSE 0 END) AS approved_bids,
                         SUM(CASE WHEN b.bid_status = 'lost' THEN 1 ELSE 0 END) AS denied_bids,
                         SUM(CASE WHEN b.bid_status = 'sentToClient' THEN 1 ELSE 0 END) AS no_response,
                         SUM(CASE WHEN b.bid_status = 'sentToClient' THEN ${amountExpression} ELSE 0 END) AS no_response_value,
                         AVG(${amountExpression}) AS average_bid_value,
                         AVG(CASE WHEN b.bid_status = 'won' THEN ${amountExpression} ELSE NULL END) AS average_won_bid_value
                    FROM projects b
                    LEFT JOIN (
                         SELECT project_id, MAX(grand_total) AS grand_total
                         FROM project_invoices
                         GROUP BY project_id
                    ) invoice_totals ON invoice_totals.project_id = b.id
                    WHERE ${this.activeProjectFilter('b')}
                    ${dateFilter.sql}
               `;

               const [summaryRows] = await db.query(summarySql, [
                    ...CLOSED_OR_SENT_STATUSES,
                    ...CLOSED_OR_SENT_STATUSES,
                    ...dateFilter.params
               ]);
               const row = summaryRows[0] || {};

               const totalBidsSent = Number(row.total_bids_sent) || 0;
               const jobsWon = Number(row.jobs_won) || 0;
               const jobsLost = Number(row.jobs_lost) || 0;
               const bidsSentValue = Number(row.bids_sent_value) || 0;
               const bidsWonValue = Number(row.bids_won_value) || 0;
               const closedJobs = jobsWon + jobsLost;
               const parsedHours = Number(hours);
               const earnedPerHour = Number.isFinite(parsedHours) && parsedHours > 0
                    ? bidsWonValue / parsedHours
                    : null;

               const noResponseClients = await this.getNoResponseClients({ filter, limit: 10 });

               return {
                    filter,
                    cards: {
                         bids_sent: {
                              count: totalBidsSent,
                              value: bidsSentValue
                         },
                         bids_won: {
                              count: jobsWon,
                              value: bidsWonValue
                         },
                         approved_bids: Number(row.approved_bids) || 0,
                         denied_bids: Number(row.denied_bids) || 0,
                         no_response: {
                              count: Number(row.no_response) || 0,
                              value: Number(row.no_response_value) || 0
                         }
                    },
                    metrics: {
                         total_bids: Number(row.total_bids) || 0,
                         total_bids_sent: totalBidsSent,
                         jobs_won: jobsWon,
                         jobs_lost: jobsLost,
                         jobs_lost_value: Number(row.jobs_lost_value) || 0,
                         conversion_rate: closedJobs > 0 ? Number(((jobsWon / closedJobs) * 100).toFixed(2)) : 0,
                         conversion_rate_value: bidsSentValue > 0 ? Number(((bidsWonValue / bidsSentValue) * 100).toFixed(2)) : 0,
                         average_bid_value: Number(row.average_bid_value) || 0,
                         average_won_bid_value: Number(row.average_won_bid_value) || 0,
                         earned_per_hour: earnedPerHour
                    },
                    no_response_clients: noResponseClients
               };
          } catch (error) {
               throw new Error(`Error fetching reporting dashboard: ${error.message}`);
          }
     }

     static async getNoResponseClients({ filter = 'all', limit = 10 } = {}) {
          try {
               const dateFilter = this.buildDateFilter(filter);
               const safeLimit = Number.isInteger(Number(limit)) && Number(limit) > 0 ? Number(limit) : 10;
               const sql = `
                    SELECT DISTINCT
                         c.id AS client_id,
                         c.company_name,
                         e.id AS employee_id,
                         CONCAT_WS(' ', e.first_name, e.last_name) AS employee_name,
                         e.email,
                         e.phone,
                         CASE WHEN e.is_admin = 1 THEN 'Admin' ELSE 'Employee' END AS designation,
                         b.id AS bid_id,
                         b.project_name,
                         COALESCE(invoice_totals.grand_total, 0) AS grand_total,
                         b.updated_at
                    FROM projects b
                    INNER JOIN project_company_employees pce ON pce.project_id = b.id
                    INNER JOIN employees e ON e.id = pce.company_employee_id
                    INNER JOIN companies c ON c.id = e.company_id
                    LEFT JOIN (
                         SELECT project_id, MAX(grand_total) AS grand_total
                         FROM project_invoices
                         GROUP BY project_id
                    ) invoice_totals ON invoice_totals.project_id = b.id
                    WHERE b.bid_status = 'sentToClient'
                    AND ${this.activeProjectFilter('b')}
                    AND c.company_type <> 'steelmart'
                    AND c.status = 'active'
                    AND e.status = 'active'
                    ${dateFilter.sql}
                    ORDER BY b.updated_at DESC, b.id DESC
                    LIMIT ?
               `;
               const [rows] = await db.query(sql, [...dateFilter.params, safeLimit]);
               return rows;
          } catch (error) {
               throw new Error(`Error fetching no response clients: ${error.message}`);
          }
     }

     static async getEmployeeReport({ page = 1, limit = 5, filter = 'all' } = {}) {
          try {
               const pagination = normalizePagination(page, limit);
               const dateFilter = this.buildDateFilter(filter);
               const crmStatusPlaceholders = normalizeStatusList(CRM_REPORT_STATUSES);
               const amountExpression = 'COALESCE(invoice_totals.grand_total, 0)';

               const [countRows] = await db.query(`
                    SELECT COUNT(*) AS total
                    FROM employees u
                    INNER JOIN companies c ON c.id = u.company_id
                    WHERE c.company_type = 'steelmart'
               `);
               const total = Number(countRows[0]?.total) || 0;

               const rowsSql = `
                    SELECT
                         u.id AS employee_id,
                         CONCAT_WS(' ', u.first_name, u.last_name) AS employee_name,
                         u.email,
                         u.role,
                         COUNT(DISTINCT b.id) AS bid_count,
                         COALESCE(SUM(${amountExpression}), 0) AS total_bid_value,
                         COALESCE(AVG(CASE WHEN b.id IS NOT NULL THEN ${amountExpression} END), 0) AS avg_dollar_per_hour,
                         CASE
                              WHEN COUNT(DISTINCT b.id) = 0 THEN 0
                              ELSE ROUND((SUM(CASE WHEN LOWER(b.bid_status) = 'won' THEN 1 ELSE 0 END) / COUNT(DISTINCT b.id)) * 100, 2)
                         END AS win_ratio
                    FROM employees u
                    INNER JOIN companies c ON c.id = u.company_id
                    LEFT JOIN projects b
                         ON b.created_by = u.id
                         AND ${this.activeProjectFilter('b')}
                         AND LOWER(b.bid_status) IN (${crmStatusPlaceholders})
                         ${dateFilter.sql}
                    LEFT JOIN (
                         SELECT project_id, MAX(grand_total) AS grand_total
                         FROM project_invoices
                         GROUP BY project_id
                    ) invoice_totals ON invoice_totals.project_id = b.id
                    WHERE c.company_type = 'steelmart'
                    GROUP BY u.id, u.first_name, u.last_name, u.email, u.role
                    ORDER BY total_bid_value DESC, employee_name ASC, u.id ASC
                    LIMIT ? OFFSET ?
               `;
               const [rows] = await db.query(rowsSql, [
                    ...CRM_REPORT_STATUSES,
                    ...dateFilter.params,
                    pagination.limit,
                    pagination.offset
               ]);

               const [summaryRows] = await db.query(`
                    SELECT
                         COUNT(*) AS lifetime_employees,
                         SUM(CASE WHEN u.status = 'active' THEN 1 ELSE 0 END) AS currently_hired
                    FROM employees u
                    INNER JOIN companies c ON c.id = u.company_id
                    WHERE c.company_type = 'steelmart'
               `);

               const biddingSummarySql = `
                    SELECT
                         SUM(
                              CASE
                                   WHEN LOWER(b.bid_status) NOT IN ('lost', 'deleted')
                                   AND ${this.buildDateCondition(filter, 'b')}
                                   THEN ${amountExpression}
                                   ELSE 0
                              END
                         ) AS current_bidding_value,
                         SUM(
                              CASE
                                   WHEN LOWER(b.bid_status) NOT IN ('lost', 'deleted')
                                   AND b.created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
                                   THEN ${amountExpression}
                                   ELSE 0
                              END
                         ) AS current_month_bidding,
                         SUM(
                              CASE
                                   WHEN LOWER(b.bid_status) NOT IN ('lost', 'deleted')
                                   AND b.created_at >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01')
                                   AND b.created_at < DATE_FORMAT(CURDATE(), '%Y-%m-01')
                                   THEN ${amountExpression}
                                   ELSE 0
                              END
                         ) AS previous_month_bidding
                    FROM projects b
                    LEFT JOIN (
                         SELECT project_id, MAX(grand_total) AS grand_total
                         FROM project_invoices
                         GROUP BY project_id
                    ) invoice_totals ON invoice_totals.project_id = b.id
                    WHERE ${this.activeProjectFilter('b')}
                    AND LOWER(b.bid_status) IN (${crmStatusPlaceholders})
               `;
               const [biddingSummaryRows] = await db.query(biddingSummarySql, [...CRM_REPORT_STATUSES]);

               const summaryRow = summaryRows[0] || {};
               const biddingRow = biddingSummaryRows[0] || {};
               const currentlyHired = Number(summaryRow.currently_hired) || 0;
               const currentBiddingValue = Number(biddingRow.current_bidding_value) || 0;
               const currentMonthBidding = Number(biddingRow.current_month_bidding) || 0;
               const previousMonthBidding = Number(biddingRow.previous_month_bidding) || 0;

               return {
                    data: rows,
                    summary: {
                         current_bidding_value: currentBiddingValue,
                         bidding_delta: currentMonthBidding - previousMonthBidding,
                         revenue_per_employee: currentlyHired > 0 ? currentBiddingValue / currentlyHired : 0,
                         revenue_delta: currentlyHired > 0 ? (currentMonthBidding - previousMonthBidding) / currentlyHired : 0,
                         currently_hired: currentlyHired,
                         lifetime_employees: Number(summaryRow.lifetime_employees) || 0
                    },
                    total,
                    page: pagination.page,
                    limit: pagination.limit,
                    pages: Math.ceil(total / pagination.limit)
               };
          } catch (error) {
               throw new Error(`Error fetching employee report: ${error.message}`);
          }
     }

     static async getEstimateLedger({ page = 1, limit = 10, search = '', filter = 'all' } = {}) {
          try {
               const pagination = normalizePagination(page, limit);
               const dateFilter = this.buildDateFilter(filter);
               const filters = [this.activeProjectFilter('b')];
               const params = [];

               if (dateFilter.sql) {
                    filters.push(dateFilter.sql.replace(/^ AND /, ''));
                    params.push(...dateFilter.params);
               }

               const searchTerm = String(search || '').trim();
               if (searchTerm) {
                    filters.push('(b.project_name LIKE ? OR b.bid_project_id LIKE ? OR c.company_name LIKE ?)');
                    params.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
               }

               const whereSql = filters.join(' AND ');
               const countSql = `
                    SELECT COUNT(DISTINCT pi.id) AS total
                    FROM project_invoices pi
                    INNER JOIN projects b ON b.id = pi.project_id
                    LEFT JOIN project_company_employees pce ON pce.project_id = b.id
                    LEFT JOIN employees e ON e.id = pce.company_employee_id
                    LEFT JOIN companies c ON c.id = e.company_id
                    WHERE ${whereSql}
               `;
               const [countRows] = await db.query(countSql, params);
               const total = Number(countRows[0]?.total) || 0;

               const sql = `
                    SELECT
                         pi.id AS invoice_id,
                         pi.project_id AS bid_id,
                         b.bid_project_id,
                         b.project_name,
                         b.bid_status AS status,
                         b.due_date,
                         GROUP_CONCAT(DISTINCT c.company_name ORDER BY c.company_name SEPARATOR ', ') AS clients,
                         pi.sub_total,
                         pi.grand_total,
                         pi.created_at,
                         pi.updated_at
                    FROM project_invoices pi
                    INNER JOIN projects b ON b.id = pi.project_id
                    LEFT JOIN project_company_employees pce ON pce.project_id = b.id
                    LEFT JOIN employees e ON e.id = pce.company_employee_id
                    LEFT JOIN companies c ON c.id = e.company_id
                    WHERE ${whereSql}
                    GROUP BY pi.id, pi.project_id, b.bid_project_id, b.project_name, b.bid_status, b.due_date, pi.sub_total, pi.grand_total, pi.created_at, pi.updated_at
                    ORDER BY b.due_date DESC, pi.id DESC
                    LIMIT ? OFFSET ?
               `;
               const [rows] = await db.query(sql, [...params, pagination.limit, pagination.offset]);

               return {
                    data: rows,
                    total,
                    page: pagination.page,
                    limit: pagination.limit,
                    pages: Math.ceil(total / pagination.limit)
               };
          } catch (error) {
               throw new Error(`Error fetching estimate ledger: ${error.message}`);
          }
     }
}

module.exports = ReportingModel;