const db = require('../../config/db');

class FinancialsAdminModel {
    static async getFinancialsByProjectId(projectId) {
        // ── 1. Get or create the project_financials record ──────────────────
        const [financials] = await db.query(
            `SELECT * FROM project_financials WHERE project_id = ?`,
            [projectId]
        );
        let financialRecord = financials[0];

        if (!financialRecord) {
            console.log(`[Model] Creating new financial record for project ${projectId}`);
            const [projects] = await db.query(
                'SELECT overhead, profit FROM projects WHERE id = ?',
                [projectId]
            );
            const proj = projects[0];
            const [result] = await db.query(
                `INSERT INTO project_financials (project_id, overhead_cost_percent, estimated_profit) VALUES (?, ?, ?)`,
                [projectId, proj?.overhead || 0, proj?.profit || 0]
            );
            const [newFinancials] = await db.query(
                `SELECT * FROM project_financials WHERE id = ?`,
                [result.insertId]
            );
            financialRecord = newFinancials[0];
        }

        // ── 2. Get project data for labour, overhead, award_number and bid_value ────────
        const [projRows] = await db.query(
            `SELECT p.base_contact_amount, p.fringes_amount, p.overhead, p.profit, p.award_number,
                    COALESCE((SELECT grand_total FROM project_invoices WHERE project_id = p.id ORDER BY id ASC LIMIT 1), 0) AS bid_value
             FROM projects p WHERE p.id = ?`,
            [projectId]
        );
        const projData = projRows[0];

        // ── 3. Labour Cost = base_contract_amount + fringes_amount ──────────
        //    Computed on-the-fly; NOT written back to DB to avoid race conditions.
        const baseAmount = Number(projData?.base_contact_amount) || 0;
        const fringesAmount = Number(projData?.fringes_amount) || 0;
        financialRecord.labour_cost = baseAmount + fringesAmount;

        // ── 4. Material Cost = sum of grand_total from project_invoices ─────
        //    Computed on-the-fly; NOT written back to DB to avoid race conditions.
        const [invoiceRows] = await db.query(
            `SELECT COALESCE(SUM(grand_total), 0) AS total_grand
             FROM project_invoices
             WHERE project_id = ?`,
            [projectId]
        );
        financialRecord.material_cost = Number(invoiceRows[0]?.total_grand) || 0;

        // ── 5. Vendor Cost = sum of approved vendor proposal prices ─────────
        //    Computed on-the-fly; NOT written back to DB to avoid race conditions.
        const [vendorRows] = await db.query(
            `SELECT COALESCE(SUM(proposal_price), 0) AS total_vendor
             FROM project_vendors
             WHERE project_id = ? AND status = 'approved' AND proposal_price IS NOT NULL`,
            [projectId]
        );
        financialRecord.vendor_cost = Number(vendorRows[0]?.total_vendor) || 0;

        // ── 6. Overhead Cost = percentage from projects table (set at onboarding) ──
        //    Computed on-the-fly; NOT written back to DB to avoid race conditions.
        if (projData?.overhead !== null && projData?.overhead !== undefined) {
            financialRecord.overhead_cost_percent = Number(projData.overhead) || 0;
        }

        // ── 7. Estimated Profit = from projects table (set at onboarding) ────
        //    Computed on-the-fly; NOT written back to DB to avoid race conditions.
        if (projData?.profit !== null && projData?.profit !== undefined) {
            financialRecord.estimated_profit = Number(projData.profit) || 0;
        }

        // ── 8. Booked Revenue, Payment Received, Balance Remaining = null ────
        //    These are left as-is from DB (for now, all null)
        financialRecord.bid_value = Number(projData?.bid_value) || 0;
        financialRecord.award_number = Number(projData?.award_number) || 0;

        // ── 9. Related tables ─────────────────────────────────────────────────
        const [changeOrders] = await db.query(
            `SELECT * FROM project_change_orders WHERE project_id = ? ORDER BY created_at DESC`,
            [projectId]
        );
        const [payments] = await db.query(
            `SELECT * FROM project_payments WHERE project_id = ? ORDER BY created_at DESC`,
            [projectId]
        );
        const [complianceDocs] = await db.query(
            `SELECT * FROM project_compliance_documents WHERE project_id = ? ORDER BY created_at DESC`,
            [projectId]
        );

        return {
            financials: financialRecord,
            changeOrders,
            payments,
            complianceDocs,
        };
    }
    
    static async updateFinancials(projectId, data) {
        // labour_cost, material_cost, vendor_cost, overhead_cost_percent are auto-computed.
        // Only allow updating: estimated_profit, payment_received, balance_remaining.
        await db.query(
            `UPDATE project_financials 
             SET estimated_profit     = COALESCE(?, estimated_profit),
                 payment_received     = COALESCE(?, payment_received),
                 balance_remaining    = COALESCE(?, balance_remaining)
             WHERE project_id = ?`,
            [
                data.estimated_profit,
                data.payment_received,
                data.balance_remaining,
                projectId,
            ]
        );

        // Sync estimated_profit → projects.profit if provided
        if (data.estimated_profit !== undefined) {
            await db.query(
                `UPDATE projects SET profit = COALESCE(?, profit) WHERE id = ?`,
                [data.estimated_profit, projectId]
            );
        }

        return { success: true };
    }


    static async addChangeOrder(projectId, data) {
        const [result] = await db.query(
            `INSERT INTO project_change_orders (project_id, name, number, status, amount)
             VALUES (?, ?, ?, ?, ?)`,
            [projectId, data.name, data.number, data.status || 'Open', data.amount]
        );
        const [row] = await db.query(`SELECT * FROM project_change_orders WHERE id = ?`, [result.insertId]);
        return row[0];
    }

    static async updateChangeOrderStatus(id, status) {
        await db.query(`UPDATE project_change_orders SET status = ? WHERE id = ?`, [status, id]);
        return { success: true };
    }

    static async addPayment(projectId, data) {
        const [result] = await db.query(
            `INSERT INTO project_payments (project_id, vendor_name, amount, date, note, invoice_file_url)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [projectId, data.vendor_name, data.amount, data.date, data.note, data.invoice_file_url]
        );
        const [row] = await db.query(`SELECT * FROM project_payments WHERE id = ?`, [result.insertId]);
        return row[0];
    }

    static async addComplianceDocument(projectId, data) {
        const [result] = await db.query(
            `INSERT INTO project_compliance_documents (project_id, document_name, type, uploaded_by, expiry_date, status, file_url)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [projectId, data.document_name, data.type, data.uploaded_by, data.expiry_date, data.status || 'File Received', data.file_url]
        );
        const [row] = await db.query(`SELECT * FROM project_compliance_documents WHERE id = ?`, [result.insertId]);
        return row[0];
    }

    static async updateComplianceDocumentStatus(id, status) {
        await db.query(`UPDATE project_compliance_documents SET status = ? WHERE id = ?`, [status, id]);
        return { success: true };
    }
}

module.exports = FinancialsAdminModel;
