const db = require('../../config/db');
const logger = require('../../common/utils/logger');

const ACTIVE_PROJECT_STATUSES = new Set(['approved']);
const INVITED_STATUSES = new Set(['invited']);
const PENDING_STATUSES = new Set(['proposal_sent']);
const LOST_STATUSES = new Set(['rejected']);
const NOT_BIDDING_STATUSES = new Set(['not_bidding']);

const normalizeStatus = (status) => String(status || '').trim().toLowerCase();

const toCurrencyValue = (value) => {
     if (value === null || value === undefined || value === '') return null;
     const amount = Number(value);
     return Number.isFinite(amount) ? amount : null;
};

const mapProjectRow = (row) => ({
     id: row.id,
     projectName: row.project_name,
     projectCode: row.bid_project_id,
     dueDate: row.due_date,
     status: row.status,
     projectStatus: row.project_status,
     price: toCurrencyValue(row.price),
     leadTime: row.lead_time || null,
     rejectedReason: row.rejected_reason || null,
     vendorEntryId: row.vendor_entry_id || null,
     rfi: {
          total: Number(row.rfi_total) || 0,
          unresolved: Number(row.rfi_unresolved) || 0
     },
     submittals: {
          open: Number(row.submittals_open) || 0
     }
});

const emptySections = () => ({
     activeProjects: [],
     invitedToBid: [],
     pendingApproval: [],
     bidsLost: [],
     notBidding: [],
     completedProjects: []
});

const buildSummary = (sections) => {
     const allProjects = Object.values(sections).flat();
     const today = new Date();
     today.setHours(0, 0, 0, 0);

     const sevenDaysFromNow = new Date(today);
     sevenDaysFromNow.setDate(today.getDate() + 7);

     return {
          totalProjects: allProjects.length,
          totalBidValue: allProjects.reduce((sum, project) => sum + (toCurrencyValue(project.price) || 0), 0),
          dueSoon: allProjects.filter((project) => {
               if (!project.dueDate) return false;
               const dueDate = new Date(project.dueDate);
               if (Number.isNaN(dueDate.getTime())) return false;
               dueDate.setHours(0, 0, 0, 0);
               return dueDate >= today && dueDate <= sevenDaysFromNow;
          }).length,
          overdue: allProjects.filter((project) => {
               if (!project.dueDate) return false;
               const dueDate = new Date(project.dueDate);
               if (Number.isNaN(dueDate.getTime())) return false;
               dueDate.setHours(0, 0, 0, 0);
               return dueDate < today && !LOST_STATUSES.has(normalizeStatus(project.status));
          }).length,
          sections: Object.fromEntries(
               Object.entries(sections).map(([key, projects]) => [key, projects.length])
          )
     };
};

class VendorDashboardModel {
     static async getDashboard(vendor) {
          try {
               const vendorCompanyId = Number(vendor?.client_id);
          if (!Number.isInteger(vendorCompanyId) || vendorCompanyId <= 0) {
               return {
                    vendor: null,
                    summary: buildSummary(emptySections()),
                    sections: emptySections()
               };
          }

          const sql = `
               SELECT DISTINCT
                    p.id,
                    p.project_name,
                    p.bid_project_id,
                    p.due_date,
                    p.created_at,
                    p.project_status,
                    COALESCE(pv.status, p.bid_status) AS status,
                    COALESCE(pv.proposal_price, invoice_totals.grand_total, 0) AS price,
                    pv.proposal_lead_time AS lead_time,
                    pv.rejected_reason AS rejected_reason,
                    0 AS rfi_total,
                    0 AS rfi_unresolved,
                    0 AS submittals_open,
                    pv.id AS vendor_entry_id
               FROM projects p
               INNER JOIN project_vendors pv ON pv.project_id = p.id AND pv.vendor_company_id = ?
               LEFT JOIN (
                    SELECT project_id, MAX(grand_total) AS grand_total
                    FROM project_invoices
                    GROUP BY project_id
               ) invoice_totals ON invoice_totals.project_id = p.id
               WHERE COALESCE(p.project_status, 'active') != 'deleted'
               ORDER BY p.due_date ASC, p.created_at DESC, p.id DESC
          `;

          const [rows] = await db.query(sql, [vendorCompanyId]);
          const sections = emptySections();

          rows.map(mapProjectRow).forEach((project) => {
               const rawStatus = String(project.status || '').trim();
               const projStatus = String(project.projectStatus || '').trim().toLowerCase();

               if (projStatus === 'completed') {
                    sections.completedProjects.push(project);
               } else if (rawStatus === 'approved') {
                    sections.activeProjects.push(project);
               } else if (rawStatus === 'invited') {
                    sections.invitedToBid.push(project);
               } else if (rawStatus === 'proposal_sent') {
                    sections.pendingApproval.push(project);
               } else if (rawStatus === 'rejected') {
                    sections.bidsLost.push(project);
               } else if (rawStatus === 'not_bidding') {
                    sections.notBidding.push(project);
               } else {
                    sections.invitedToBid.push(project);
               }
          });

          return {
               vendor: {
                    id: vendor.id,
                    companyId: vendor.client_id,
                    companyName: vendor.company_name,
                    email: vendor.email
               },
               summary: buildSummary(sections),
               sections
          };
          } catch (error) {
               logger.error('Error in VendorDashboardModel.getDashboard', { error: error.message, vendorId: vendor?.id });
               throw new Error(`Error fetching vendor dashboard: ${error.message}`);
          }
     }

     static async getProjectById(vendor, projectId) {
          try {
               const vendorCompanyId = Number(vendor?.client_id);
          if (!Number.isInteger(vendorCompanyId) || vendorCompanyId <= 0) {
               return null;
          }

          const sql = `
               SELECT DISTINCT
                    p.id,
                    p.project_name,
                    p.bid_project_id,
                    p.due_date,
                    p.created_at,
                    pv.status AS vendor_status,
                    p.bid_status,
                    p.drawing_description,
                    p.drawing_date,
                    p.address,
                    p.tax_exempt,
                    p.db_wage_rate,
                    p.fringes_amount,
                    p.base_contact_amount,
                    p.scope_of_work,
                    COALESCE(pv.proposal_price, invoice_totals.grand_total, 0) AS price,
                    pv.proposal_lead_time AS lead_time,
                    pv.rejected_reason AS rejected_reason,
                    pv.proposal_documents,
                    pv.id AS vendor_entry_id,
                    0 AS rfi_total,
                    0 AS rfi_unresolved,
                    0 AS submittals_open
               FROM projects p
               INNER JOIN project_vendors pv ON pv.project_id = p.id AND pv.vendor_company_id = ?
               LEFT JOIN (
                    SELECT project_id, MAX(grand_total) AS grand_total
                    FROM project_invoices
                    GROUP BY project_id
               ) invoice_totals ON invoice_totals.project_id = p.id
               WHERE p.id = ?
               AND COALESCE(p.project_status, 'active') != 'deleted'
               LIMIT 1
          `;

          const [rows] = await db.query(sql, [vendorCompanyId, projectId]);
          if (!rows || rows.length === 0) {
               return null;
          }

          const row = rows[0];
          return {
               id: row.id,
               projectName: row.project_name,
               projectCode: row.bid_project_id,
               dueDate: row.due_date,
               status: row.vendor_status || row.bid_status,
               vendorStatus: row.vendor_status,
               description: row.drawing_description || '',
               scopeOfWork: row.scope_of_work || '',
               location: row.address || '',
               price: toCurrencyValue(row.price),
               leadTime: row.lead_time || null,
               rejectedReason: row.rejected_reason || null,
               proposalDocuments: row.proposal_documents || null,
               vendorEntryId: row.vendor_entry_id || null,
               drawingDate: row.drawing_date,
               taxExempt: row.tax_exempt,
               dbWageRate: row.db_wage_rate,
               fringesAmount: toCurrencyValue(row.fringes_amount),
               baseContractAmount: toCurrencyValue(row.base_contact_amount),
               rfi: {
                    total: Number(row.rfi_total) || 0,
                    unresolved: Number(row.rfi_unresolved) || 0
               },
               submittals: {
                    open: Number(row.submittals_open) || 0
               }
          };
          } catch (error) {
               logger.error('Error in VendorDashboardModel.getProjectById', { error: error.message, vendorId: vendor?.id, projectId });
               throw new Error(`Error fetching vendor project: ${error.message}`);
          }
     }
}

module.exports = VendorDashboardModel;

