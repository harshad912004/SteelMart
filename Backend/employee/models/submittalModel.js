const db = require('../../config/db');
const { buildStatusCounts, SUBMITTAL_STATUSES } = require('../../common/utils/projectWorkflow');

class SubmittalModel {
  static async createSubmittal(projectId, title, type, dueDate, priority, description, ballInCourt, createdBy) {
    const [result] = await db.query(
      `INSERT INTO project_submittals (project_id, title, type, due_date, priority, description, ball_in_court, created_by, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [projectId, title, type || null, dueDate || null, priority || 'Medium', description || null, ballInCourt || null, createdBy || null]
    );
    return result.insertId;
  }

  static async getSubmittalsByProjectId(projectId, page = 1, limit = 5, search = '', status = 'all') {
    let whereClause = 's.project_id = ?';
    const params = [projectId];
    
    if (status && status !== 'all') {
      whereClause += ' AND s.status = ?';
      params.push(status);
    }
    
    if (search) {
      whereClause += ' AND (s.title LIKE ? OR s.description LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    const countQuery = `SELECT COUNT(*) as total FROM project_submittals s WHERE ${whereClause}`;
    const [[countRow]] = await db.query(countQuery, params);
    const totalRecords = countRow.total || 0;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    
    // Get submittals along with latest version status and creator info
    const query = `
      SELECT s.*, 
        CONCAT_WS(' ', e.first_name, e.last_name) AS created_by_name,
        (SELECT MAX(version) FROM project_submittal_versions v WHERE v.submittal_id = s.id AND v.parent_id IS NULL) as latest_version,
        (SELECT status FROM project_submittal_versions v WHERE v.submittal_id = s.id AND v.parent_id IS NULL ORDER BY version DESC LIMIT 1) as latest_version_status
      FROM project_submittals s
      LEFT JOIN employees e ON e.id = s.created_by
      WHERE ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const [submittals] = await db.query(query, [...params, parseInt(limit, 10), parseInt(offset, 10)]);
    
    for (const submittal of submittals) {
      const versions = await this.getVersionsBySubmittalId(submittal.id);
      for (const version of versions) {
        version.replies = await this.getRepliesByVersionId(version.id);
      }
      submittal.versions = versions;
    }

    return {
      submittals,
      totalRecords,
      totalPages: Math.ceil(totalRecords / parseInt(limit, 10))
    };
  }

  static async getSubmittalById(submittalId) {
    const [submittals] = await db.query(
      `SELECT s.*, CONCAT_WS(' ', e.first_name, e.last_name) AS created_by_name
       FROM project_submittals s
       LEFT JOIN employees e ON e.id = s.created_by
       WHERE s.id = ? LIMIT 1`,
      [submittalId]
    );
    if (submittals.length === 0) return null;
    return submittals[0];
  }

  static async getSubmittalByProjectIdAndId(projectId, submittalId) {
    const [submittals] = await db.query(
      `SELECT s.*, CONCAT_WS(' ', e.first_name, e.last_name) AS created_by_name
       FROM project_submittals s
       LEFT JOIN employees e ON e.id = s.created_by
       WHERE s.project_id = ? AND s.id = ?
       LIMIT 1`,
      [projectId, submittalId]
    );
    if (submittals.length === 0) return null;
    return submittals[0];
  }

  static async updateSubmittal(submittalId, fields) {
    const updates = [];
    const params = [];

    const allowedFields = ['title', 'type', 'due_date', 'priority', 'description', 'status', 'ball_in_court'];
    for (const key of Object.keys(fields)) {
      if (allowedFields.includes(key) && fields[key] !== undefined) {
        updates.push(`${key} = ?`);
        params.push(fields[key]);
      }
    }

    if (updates.length > 0) {
      params.push(submittalId);
      await db.query(
        `UPDATE project_submittals SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
        params
      );
    }
  }

  static async deleteSubmittal(submittalId) {
    await db.query('DELETE FROM project_submittals WHERE id = ?', [submittalId]);
  }

  static async addVersion(submittalId, message, status, fileUrl, fileName, createdBy) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [[maxVersionRow]] = await connection.query(
        'SELECT MAX(version) as maxVer FROM project_submittal_versions WHERE submittal_id = ? AND parent_id IS NULL',
        [submittalId]
      );
      const version = (maxVersionRow.maxVer || 0) + 1;

      const [result] = await connection.query(
        `INSERT INTO project_submittal_versions (submittal_id, parent_id, version, message, status, file_url, file_name, created_by, created_at, updated_at)
         VALUES (?, NULL, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [submittalId, version, message, status || 'open', fileUrl || null, fileName || null, createdBy || null]
      );

      await this.syncSubmittalState(submittalId, connection, status || 'open');

      await connection.commit();
      return result.insertId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async addReply(submittalId, parentId, message, createdBy) {
    // A reply takes the same version number as its parent
    const [parents] = await db.query('SELECT version FROM project_submittal_versions WHERE id = ? LIMIT 1', [parentId]);
    const version = parents.length > 0 ? parents[0].version : 1;

    const [result] = await db.query(
      `INSERT INTO project_submittal_versions (submittal_id, parent_id, version, message, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [submittalId, parentId, version, message, createdBy || null]
    );
    return result.insertId;
  }

  static async getVersionsBySubmittalId(submittalId) {
    const [versions] = await db.query(
      `SELECT v.*, 
        e.first_name, e.last_name, 
        CONCAT_WS(' ', e.first_name, e.last_name) AS created_by_name,
        c.company_name AS company
       FROM project_submittal_versions v
       LEFT JOIN employees e ON e.id = v.created_by
       LEFT JOIN companies c ON c.id = e.company_id
       WHERE v.submittal_id = ? AND v.parent_id IS NULL
       ORDER BY v.version DESC`,
      [submittalId]
    );
    return versions;
  }

  static async getRepliesByVersionId(versionId) {
    const [replies] = await db.query(
      `SELECT v.*, 
        e.first_name, e.last_name, 
        CONCAT_WS(' ', e.first_name, e.last_name) AS created_by_name,
        c.company_name AS company
       FROM project_submittal_versions v
       LEFT JOIN employees e ON e.id = v.created_by
       LEFT JOIN companies c ON c.id = e.company_id
       WHERE v.parent_id = ?
       ORDER BY v.created_at ASC`,
      [versionId]
    );
    return replies;
  }

  static async getVersionById(versionId) {
    const [versions] = await db.query(
      `SELECT v.*,
        CONCAT_WS(' ', e.first_name, e.last_name) AS created_by_name,
        c.company_name AS company
       FROM project_submittal_versions v
       LEFT JOIN employees e ON e.id = v.created_by
       LEFT JOIN companies c ON c.id = e.company_id
       WHERE v.id = ?
       LIMIT 1`,
      [versionId]
    );
    if (versions.length === 0) return null;
    return versions[0];
  }

  static async getVersionBySubmittalId(versionId, submittalId) {
    const [versions] = await db.query(
      `SELECT v.*,
        CONCAT_WS(' ', e.first_name, e.last_name) AS created_by_name,
        c.company_name AS company
       FROM project_submittal_versions v
       LEFT JOIN employees e ON e.id = v.created_by
       LEFT JOIN companies c ON c.id = e.company_id
       WHERE v.id = ? AND v.submittal_id = ?
       LIMIT 1`,
      [versionId, submittalId]
    );
    if (versions.length === 0) return null;
    return versions[0];
  }

  static async updateVersion(versionId, message, status) {
    const updates = [];
    const params = [];

    if (message !== undefined) { updates.push('message = ?'); params.push(message); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }

    if (updates.length > 0) {
      const version = await this.getVersionById(versionId);
      params.push(versionId);
      await db.query(
        `UPDATE project_submittal_versions SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
        params
      );
      if (version?.submittal_id && version.parent_id === null && status !== undefined) {
        await this.syncSubmittalState(version.submittal_id, db, status);
      }
    }
  }

  static async deleteVersion(versionId) {
    const version = await this.getVersionById(versionId);
    await db.query('DELETE FROM project_submittal_versions WHERE id = ?', [versionId]);
    if (version?.submittal_id && version.parent_id === null) {
      await this.syncSubmittalState(version.submittal_id);
    }
  }

  static async syncSubmittalState(submittalId, connection = db, fallbackStatus = 'open') {
    const [[latestVersionRow]] = await connection.query(
      `SELECT status
       FROM project_submittal_versions
       WHERE submittal_id = ? AND parent_id IS NULL
       ORDER BY version DESC, id DESC
       LIMIT 1`,
      [submittalId]
    );

    await connection.query(
      'UPDATE project_submittals SET status = ?, updated_at = NOW() WHERE id = ?',
      [latestVersionRow?.status || fallbackStatus, submittalId]
    );
  }

  static async getStatusCounts(projectId) {
    const [rows] = await db.query(
      `SELECT status, COUNT(*) as count
       FROM project_submittals
       WHERE project_id = ?
       GROUP BY status`,
      [projectId]
    );
    return buildStatusCounts(rows, SUBMITTAL_STATUSES);
  }

  static async getProjectsWithSubmittals() {
    const query = `
      SELECT DISTINCT b.id, b.project_name, b.bid_project_id
      FROM projects b
      INNER JOIN project_submittals s ON s.project_id = b.id
      WHERE LOWER(COALESCE(b.bid_status, '')) = 'won'
        AND COALESCE(b.project_status, 'active') IN ('active', 'archived', 'completed')
      ORDER BY b.project_name ASC
    `;
    const [rows] = await db.query(query);
    return rows;
  }
}

module.exports = SubmittalModel;
