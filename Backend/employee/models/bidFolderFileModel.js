const db = require('../../config/db');

const ROOT_FILES_FOLDER_NAME = '__bid_root_files__';

class BidFolderFileModel {
     static async ensureSchema() {
          return;
     }

     static folderSelect(alias = 'bf') {
          return `
               ${alias}.id,
               ${alias}.project_id AS bid_id,
               ${alias}.parent_id,
               ${alias}.folder_name,
               ${alias}.created_at,
               ${alias}.updated_at
          `;
     }

     static fileSelect(alias = 'pf') {
          return `
               ${alias}.id,
               ${alias}.project_folder_id AS folder_id,
               ${alias}.file_name,
               ${alias}.file_path,
               ${alias}.file_size,
               ${alias}.mime_type,
               ${alias}.created_by,
               ${alias}.created_at,
               ${alias}.updated_at
          `;
     }

     static async getBidById(bidId) {
          try {
               const [rows] = await db.query(
                    `SELECT b.id, b.bid_project_id, b.project_name
                     FROM projects b
                     WHERE b.id = ?
                     AND COALESCE(b.project_status, 'active') IN ('active', 'archived', 'completed')
                     AND COALESCE(b.bid_status, 'bidInProgress') <> 'deleted'
                     LIMIT 1`,
                    [bidId]
               );
               return rows[0] || null;
          } catch (error) {
               throw new Error(`Error fetching bid: ${error.message}`);
          }
     }

     static async getFolderByName(bidId, parentId, folderName, excludeId = null) {
          try {
               let sql = `
                    SELECT ${this.folderSelect('pf')}
                    FROM project_folders pf
                    WHERE pf.project_id = ?
                    AND ((? IS NULL AND pf.parent_id IS NULL) OR pf.parent_id = ?)
                    AND LOWER(pf.folder_name) = LOWER(?)
               `;
               const params = [bidId, parentId, parentId, folderName];

               if (excludeId) {
                    sql += ' AND pf.id != ?';
                    params.push(excludeId);
               }

               sql += ' LIMIT 1';
               const [rows] = await db.query(sql, params);
               return rows[0] || null;
          } catch (error) {
               throw new Error(`Error fetching folder by name: ${error.message}`);
          }
     }

     static async createFolder(folderData) {
          try {
               const payload = {
                    project_id: folderData.bid_id,
                    parent_id: folderData.parent_id ?? null,
                    folder_name: folderData.folder_name,
                    created_by: folderData.created_by || null,
                    updated_by: folderData.updated_by || folderData.created_by || null
               };
               const [result] = await db.query('INSERT INTO project_folders SET ?, created_at = NOW(), updated_at = NOW()', [payload]);
               return result.insertId;
          } catch (error) {
               throw new Error(`Error creating folder: ${error.message}`);
          }
     }

     static async getFolderById(folderId) {
          try {
               const [rows] = await db.query(
                    `SELECT ${this.folderSelect('pf')}
                     FROM project_folders pf
                     WHERE pf.id = ?
                     LIMIT 1`,
                    [folderId]
               );
               return rows[0] || null;
          } catch (error) {
               throw new Error(`Error fetching folder by id: ${error.message}`);
          }
     }

     static async getFolderByIdAndBid(bidId, folderId) {
          try {
               const [rows] = await db.query(
                    `SELECT ${this.folderSelect('pf')}
                     FROM project_folders pf
                     WHERE pf.id = ?
                     AND pf.project_id = ?
                     LIMIT 1`,
                    [folderId, bidId]
               );
               return rows[0] || null;
          } catch (error) {
               throw new Error(`Error fetching folder for bid: ${error.message}`);
          }
     }

     static async getFoldersByBidAndParent(bidId, parentId = null) {
          try {
               const [rows] = await db.query(
                    `SELECT ${this.folderSelect('pf')}
                     FROM project_folders pf
                     WHERE pf.project_id = ?
                     AND ((? IS NULL AND pf.parent_id IS NULL) OR pf.parent_id = ?)
                     AND LOWER(pf.folder_name) != LOWER(?)
                     ORDER BY pf.folder_name ASC, pf.id ASC`,
                    [bidId, parentId, parentId, ROOT_FILES_FOLDER_NAME]
               );
               return rows;
          } catch (error) {
               throw new Error(`Error fetching bid folders: ${error.message}`);
          }
     }

     static async getFolderStatsForFolderIds(folderIds) {
          try {
               const ids = Array.isArray(folderIds)
                    ? folderIds.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0)
                    : [];

               if (ids.length === 0) {
                    return {};
               }

               const placeholders = ids.map(() => '?').join(', ');
               const [rows] = await db.query(
                    `WITH RECURSIVE folder_tree AS (
                         SELECT pf.id AS root_id, pf.id AS folder_id
                         FROM project_folders pf
                         WHERE pf.id IN (${placeholders})

                         UNION ALL

                         SELECT ft.root_id, child.id AS folder_id
                         FROM folder_tree ft
                         INNER JOIN project_folders child ON child.parent_id = ft.folder_id
                    )
                    SELECT
                         ft.root_id AS folder_id,
                         COUNT(pf2.id) AS file_count,
                         COALESCE(SUM(pf2.file_size), 0) AS total_size
                    FROM folder_tree ft
                    LEFT JOIN project_files pf2 ON pf2.project_folder_id = ft.folder_id
                    GROUP BY ft.root_id`,
                    ids
               );

               return rows.reduce((statsByFolderId, row) => {
                    statsByFolderId[row.folder_id] = {
                         file_count: Number(row.file_count) || 0,
                         total_size: Number(row.total_size) || 0
                    };
                    return statsByFolderId;
               }, {});
          } catch (error) {
               throw new Error(`Error fetching folder stats: ${error.message}`);
          }
     }

     static async getRootFilesFolder(bidId) {
          try {
               const [rows] = await db.query(
                    `SELECT ${this.folderSelect('pf')}
                     FROM project_folders pf
                     WHERE pf.project_id = ?
                     AND pf.parent_id IS NULL
                     AND LOWER(pf.folder_name) = LOWER(?)
                     LIMIT 1`,
                    [bidId, ROOT_FILES_FOLDER_NAME]
               );
               return rows[0] || null;
          } catch (error) {
               throw new Error(`Error fetching root files folder: ${error.message}`);
          }
     }

     static async getChildFolders(folderId) {
          try {
               const [rows] = await db.query(
                    `SELECT ${this.folderSelect('pf')}
                     FROM project_folders pf
                     WHERE pf.parent_id = ?
                     ORDER BY pf.folder_name ASC, pf.id ASC`,
                    [folderId]
               );
               return rows;
          } catch (error) {
               throw new Error(`Error fetching child folders: ${error.message}`);
          }
     }

     static async renameFolder(folderId, folderName) {
          try {
               const [result] = await db.query(
                    `UPDATE project_folders
                     SET folder_name = ?, updated_at = NOW()
                     WHERE id = ?`,
                    [folderName, folderId]
               );
               return result.affectedRows > 0;
          } catch (error) {
               throw new Error(`Error renaming folder: ${error.message}`);
          }
     }

     static async deleteFolder(folderId) {
          try {
               const [result] = await db.query('DELETE FROM project_folders WHERE id = ?', [folderId]);
               return result.affectedRows > 0;
          } catch (error) {
               throw new Error(`Error deleting folder: ${error.message}`);
          }
     }

     static async getFileByName(folderId, fileName, excludeId = null) {
          try {
               let sql = `
                    SELECT ${this.fileSelect('pf')}
                    FROM project_files pf
                    WHERE pf.project_folder_id = ?
                    AND LOWER(pf.file_name) = LOWER(?)
               `;
               const params = [folderId, fileName];

               if (excludeId) {
                    sql += ' AND pf.id != ?';
                    params.push(excludeId);
               }

               sql += ' LIMIT 1';
               const [rows] = await db.query(sql, params);
               return rows[0] || null;
          } catch (error) {
               throw new Error(`Error fetching file by name: ${error.message}`);
          }
     }

     static async createFile(fileData) {
          try {
               const payload = {
                    project_folder_id: fileData.folder_id,
                    file_name: fileData.file_name,
                    file_path: fileData.file_path,
                    file_size: fileData.file_size,
                    mime_type: fileData.mime_type,
                    created_by: fileData.created_by,
                    updated_by: fileData.updated_by || fileData.created_by || null
               };
               const [result] = await db.query('INSERT INTO project_files SET ?, created_at = NOW(), updated_at = NOW()', [payload]);
               return result.insertId;
          } catch (error) {
               throw new Error(`Error creating file: ${error.message}`);
          }
     }

     static async getFileById(fileId) {
          try {
               const [rows] = await db.query(
                    `SELECT ${this.fileSelect('pf')}
                     FROM project_files pf
                     WHERE pf.id = ?
                     LIMIT 1`,
                    [fileId]
               );
               return rows[0] || null;
          } catch (error) {
               throw new Error(`Error fetching file by id: ${error.message}`);
          }
     }

     static async getFileByIdInFolder(bidId, folderId, fileId) {
          try {
               const [rows] = await db.query(
                    `SELECT ${this.fileSelect('pf')}
                     FROM project_files pf
                     INNER JOIN project_folders pfo ON pfo.id = pf.project_folder_id
                     WHERE pf.id = ?
                     AND pf.project_folder_id = ?
                     AND pfo.project_id = ?
                     LIMIT 1`,
                    [fileId, folderId, bidId]
               );
               return rows[0] || null;
          } catch (error) {
               throw new Error(`Error fetching file for folder: ${error.message}`);
          }
     }

     static async getFilesByFolder(folderId) {
          try {
               const [rows] = await db.query(
                    `SELECT ${this.fileSelect('pf')}
                     FROM project_files pf
                     WHERE pf.project_folder_id = ?
                     ORDER BY pf.file_name ASC, pf.id ASC`,
                    [folderId]
               );
               return rows;
          } catch (error) {
               throw new Error(`Error fetching folder files: ${error.message}`);
          }
     }

     static async getFilesByFolderIds(folderIds) {
          try {
               const ids = Array.isArray(folderIds)
                    ? folderIds.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0)
                    : [];

               if (ids.length === 0) {
                    return [];
               }

               const placeholders = ids.map(() => '?').join(', ');
               const [rows] = await db.query(
                    `SELECT ${this.fileSelect('pf')}
                     FROM project_files pf
                     WHERE pf.project_folder_id IN (${placeholders})`,
                    ids
               );
               return rows;
          } catch (error) {
               throw new Error(`Error fetching files by folders: ${error.message}`);
          }
     }

     static async renameFile(fileId, fileName) {
          try {
               const [result] = await db.query(
                    `UPDATE project_files
                     SET file_name = ?, updated_at = NOW()
                     WHERE id = ?`,
                    [fileName, fileId]
               );
               return result.affectedRows > 0;
          } catch (error) {
               throw new Error(`Error renaming file: ${error.message}`);
          }
     }

     static async deleteFile(fileId) {
          try {
               const [result] = await db.query('DELETE FROM project_files WHERE id = ?', [fileId]);
               return result.affectedRows > 0;
          } catch (error) {
               throw new Error(`Error deleting file: ${error.message}`);
          }
     }
}

BidFolderFileModel.ROOT_FILES_FOLDER_NAME = ROOT_FILES_FOLDER_NAME;

module.exports = BidFolderFileModel;
