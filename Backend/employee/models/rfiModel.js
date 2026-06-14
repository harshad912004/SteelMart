const db = require('../../config/db');
const { buildStatusCounts, RFI_STATUSES } = require('../../common/utils/projectWorkflow');

class RFIModel {
  static async createRFI(projectId, title, priority, notes, description, ballInCourt, createdBy) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [[maxSrNoRow]] = await connection.query(
        'SELECT MAX(sr_no) as maxSrNo FROM project_rfis WHERE project_id = ?',
        [projectId]
      );
      const srNo = (maxSrNoRow.maxSrNo || 0) + 1;

      const [result] = await connection.query(
        `INSERT INTO project_rfis (project_id, sr_no, title, priority, notes, description, ball_in_court, created_by, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [projectId, srNo, title, priority || 'Medium', notes || null, description || null, ballInCourt || null, createdBy || null]
      );

      await connection.commit();
      return result.insertId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async getRFIsByProjectId(projectId, page = 1, limit = 5, search = '', status = 'all') {
    let whereClause = 'r.project_id = ?';
    const params = [projectId];
    
    if (status && status !== 'all') {
      whereClause += ' AND r.status = ?';
      params.push(status);
    }
    
    if (search) {
      whereClause += ' AND (r.title LIKE ? OR r.notes LIKE ? OR r.description LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    const countQuery = `SELECT COUNT(*) as total FROM project_rfis r WHERE ${whereClause}`;
    const [[countRow]] = await db.query(countQuery, params);
    const totalRecords = countRow.total || 0;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    
    const query = `
      SELECT r.*, 
        CONCAT_WS(' ', e.first_name, e.last_name) AS created_by_name,
        (SELECT COUNT(*) FROM project_rfi_history h WHERE h.rfi_id = r.id) as history_count
      FROM project_rfis r
      LEFT JOIN employees e ON e.id = r.created_by
      WHERE ${whereClause}
      ORDER BY r.sr_no ASC
      LIMIT ? OFFSET ?
    `;
    
    const [rfis] = await db.query(query, [...params, parseInt(limit, 10), parseInt(offset, 10)]);
    
    return {
      rfis,
      totalRecords,
      totalPages: Math.ceil(totalRecords / parseInt(limit, 10))
    };
  }

  static async getRFIById(rfiId) {
    const [rfis] = await db.query(
      `SELECT r.*, CONCAT_WS(' ', e.first_name, e.last_name) AS created_by_name
       FROM project_rfis r
       LEFT JOIN employees e ON e.id = r.created_by
       WHERE r.id = ? LIMIT 1`,
      [rfiId]
    );
    if (rfis.length === 0) return null;
    return rfis[0];
  }

  static async getRFIByProjectIdAndId(projectId, rfiId) {
    const [rfis] = await db.query(
      `SELECT r.*, CONCAT_WS(' ', e.first_name, e.last_name) AS created_by_name
       FROM project_rfis r
       LEFT JOIN employees e ON e.id = r.created_by
       WHERE r.project_id = ? AND r.id = ?
       LIMIT 1`,
      [projectId, rfiId]
    );
    if (rfis.length === 0) return null;
    return rfis[0];
  }

  static async updateRFI(rfiId, fields) {
    const updates = [];
    const params = [];

    const allowedFields = ['title', 'notes', 'description', 'status', 'priority', 'ball_in_court'];
    for (const key of Object.keys(fields)) {
      if (allowedFields.includes(key) && fields[key] !== undefined) {
        updates.push(`${key} = ?`);
        params.push(fields[key]);
      }
    }

    if (updates.length > 0) {
      params.push(rfiId);
      await db.query(
        `UPDATE project_rfis SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
        params
      );
    }
  }

  static async deleteRFI(rfiId) {
    await db.query('DELETE FROM project_rfis WHERE id = ?', [rfiId]);
  }

  static async getStatusCounts(projectId) {
    const [rows] = await db.query(
      `SELECT status, COUNT(*) as count FROM project_rfis WHERE project_id = ? GROUP BY status`,
      [projectId]
    );
    return buildStatusCounts(rows, RFI_STATUSES);
  }

  static async addHistory(rfiId, message, fileUrl, fileName, isReplyOnly, createdBy) {
    const [result] = await db.query(
      `INSERT INTO project_rfi_history (rfi_id, message, file_url, file_name, is_reply_only, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [rfiId, message, fileUrl || null, fileName || null, isReplyOnly ? 1 : 0, createdBy || null]
    );
    return result.insertId;
  }

  static async getHistoryByRfiId(rfiId) {
    const [history] = await db.query(
      `SELECT h.*, 
        e.first_name, e.last_name, 
        CONCAT_WS(' ', e.first_name, e.last_name) AS created_by_name,
        c.company_name AS company
       FROM project_rfi_history h
       LEFT JOIN employees e ON e.id = h.created_by
       LEFT JOIN companies c ON c.id = e.company_id
       WHERE h.rfi_id = ?
       ORDER BY h.created_at ASC`,
      [rfiId]
    );
    return history;
  }

  static async deleteHistory(historyId) {
    await db.query('DELETE FROM project_rfi_history WHERE id = ?', [historyId]);
  }

  static async getHistoryById(historyId) {
    const [history] = await db.query(
      `SELECT h.*,
        CONCAT_WS(' ', e.first_name, e.last_name) AS created_by_name,
        c.company_name AS company
       FROM project_rfi_history h
       LEFT JOIN employees e ON e.id = h.created_by
       LEFT JOIN companies c ON c.id = e.company_id
       WHERE h.id = ?
       LIMIT 1`,
      [historyId]
    );
    if (history.length === 0) return null;
    return history[0];
  }

  static async getProjectsWithRFIs() {
    const query = `
      SELECT DISTINCT b.id, b.project_name, b.bid_project_id
      FROM projects b
      INNER JOIN project_rfis r ON r.project_id = b.id
      WHERE LOWER(COALESCE(b.bid_status, '')) = 'won'
        AND COALESCE(b.project_status, 'active') IN ('active', 'archived', 'completed')
      ORDER BY b.project_name ASC
    `;
    const [rows] = await db.query(query);
    return rows;
  }
}

module.exports = RFIModel;
