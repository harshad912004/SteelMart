const db = require('../../config/db');

class BidCostDetailModel {
     static async hasSavedCostDetails(bidId) {
          try {
               const [rows] = await db.query(
                    `SELECT id
                     FROM project_invoices
                     WHERE project_id = ?
                     ORDER BY id ASC
                     LIMIT 1`,
                    [bidId]
               );

               return Boolean(rows[0]?.id);
          } catch (error) {
               throw new Error(`Error checking saved cost details: ${error.message}`);
          }
     }

     static async getCostDetailsByBidId(bidId) {
          try {
               const sql = `
                    SELECT
                         pii.id,
                         pii.project_invoice_id AS bid_invoice_id,
                         pii.item,
                         pii.description,
                         pii.quantity,
                         pii.quantity AS qty,
                         pii.rate,
                         pii.price,
                         pii.created_by,
                         pii.created_at,
                         pii.updated_at,
                         COALESCE(pi.sub_total, 0) AS sub_total,
                         COALESCE(pi.grand_total, 0) AS grand_total
                    FROM project_invoices pi
                    LEFT JOIN project_invoice_items pii ON pi.id = pii.project_invoice_id
                    WHERE pi.id = (
                         SELECT pi_first.id
                         FROM project_invoices pi_first
                         WHERE pi_first.project_id = ?
                         ORDER BY pi_first.id ASC
                         LIMIT 1
                    )
                    ORDER BY pii.id ASC
               `;
               const [rows] = await db.query(sql, [bidId]);
               if (rows.length === 0) {
                    return [];
               }

               const hasItems = rows.some((row) => row.id !== null);
               if (!hasItems) {
                    return [
                         {
                              items: [],
                              sub_total: Number(rows[0].sub_total) || 0,
                              grand_total: Number(rows[0].grand_total) || 0
                         }
                    ];
               }

               return rows.filter((row) => row.id !== null);
          } catch (error) {
               throw new Error(`Error fetching cost details: ${error.message}`);
          }
     }

     static async saveCostDetails(bidId, details, createdBy) {
          const connection = await db.getConnection();
          try {
               await connection.beginTransaction();

               const items = Array.isArray(details?.items) ? details.items : [];
               const subTotal = items.reduce((sum, item) => {
                    const quantity = Number(item?.quantity) || 0;
                    const rate = Number(item?.rate) || 0;
                    return sum + (quantity * rate);
               }, 0);
               const grandTotal = subTotal;

               const [invoiceRows] = await connection.query(
                    `SELECT id
                     FROM project_invoices
                     WHERE project_id = ?
                     ORDER BY id ASC
                     LIMIT 1
                     FOR UPDATE`,
                    [bidId]
               );

               let bidInvoiceId = invoiceRows[0]?.id || null;

               if (bidInvoiceId) {
                    await connection.query(
                         `UPDATE project_invoices
                          SET sub_total = ?, grand_total = ?, updated_by = ?, updated_at = NOW()
                          WHERE id = ?`,
                         [subTotal, grandTotal, createdBy || null, bidInvoiceId]
                    );
               } else {
                    const [invoiceResult] = await connection.query(
                         `INSERT INTO project_invoices (project_id, sub_total, grand_total, created_by, updated_by, created_at, updated_at)
                          VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
                         [bidId, subTotal, grandTotal, createdBy || null, createdBy || null]
                    );
                    bidInvoiceId = invoiceResult.insertId;
               }

               const [existingItems] = await connection.query(
                    `SELECT id
                     FROM project_invoice_items
                     WHERE project_invoice_id = ?`,
                    [bidInvoiceId]
               );

               const existingItemIds = new Set(existingItems.map((row) => Number(row.id)).filter(Boolean));
               const retainedItemIds = new Set();

               for (const item of items) {
                    const itemId = Number(item?.id);
                    const itemData = [
                         item?.item || '',
                         item?.description || '',
                         Number(item?.quantity) || 0,
                         Number(item?.rate) || 0
                    ];

                    if (existingItemIds.has(itemId)) {
                         await connection.query(
                              `UPDATE project_invoice_items
                               SET item = ?, description = ?, quantity = ?, rate = ?, updated_by = ?, updated_at = NOW()
                               WHERE id = ? AND project_invoice_id = ?`,
                              [...itemData, createdBy || null, itemId, bidInvoiceId]
                         );
                         retainedItemIds.add(itemId);
                         continue;
                    }

                    const [insertItemResult] = await connection.query(
                         `INSERT INTO project_invoice_items
                              (project_invoice_id, item, description, quantity, rate, created_by, updated_by, created_at, updated_at)
                          VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                         [bidInvoiceId, ...itemData, createdBy || null, createdBy || null]
                    );
                    retainedItemIds.add(Number(insertItemResult.insertId));
               }

               const deletedItemIds = [...existingItemIds].filter((itemId) => !retainedItemIds.has(itemId));
               if (deletedItemIds.length > 0) {
                    await connection.query(
                         `DELETE FROM project_invoice_items
                          WHERE project_invoice_id = ? AND id IN (?)`,
                         [bidInvoiceId, deletedItemIds]
                    );
               }

               await connection.commit();

               const savedDetails = await this.getCostDetailsByBidId(bidId);
               if (savedDetails.length === 1 && Array.isArray(savedDetails[0]?.items)) {
                    return {
                         items: [],
                         sub_total: Number(savedDetails[0].sub_total) || 0,
                         grand_total: Number(savedDetails[0].grand_total) || 0
                    };
               }

               return {
                    items: savedDetails,
                    sub_total: Number(savedDetails[0]?.sub_total) || subTotal,
                    grand_total: Number(savedDetails[0]?.grand_total) || grandTotal
               };
          } catch (error) {
               await connection.rollback();
               throw new Error(`Error saving cost details: ${error.message}`);
          } finally {
               connection.release();
          }
     }
}

module.exports = BidCostDetailModel;
