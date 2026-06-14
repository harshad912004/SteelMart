const db = require('../../config/db');

class ProjectGalleryModel {
     static async createGallery(bidId, title, notes = null) {
          const [result] = await db.query(
               'INSERT INTO project_gallery (project_id, title, notes, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
               [bidId, title, notes]
          );
          return result.insertId;
     }

     static async getGalleriesByBidId(bidId) {
          const [galleries] = await db.query(
               'SELECT id, project_id, title, notes, created_at, updated_at FROM project_gallery WHERE project_id = ? ORDER BY created_at DESC',
               [bidId]
          );

          if (galleries.length === 0) return [];

          const galleryIds = galleries.map(g => g.id);
          
          const [photos] = await db.query(
               'SELECT id, project_gallery_id, image_url, title, notes, gallery_status, created_at, updated_at FROM project_gallery_photos WHERE project_gallery_id IN (?) AND gallery_status != ? ORDER BY created_at ASC',
               [galleryIds, 'deleted']
          );

          const [tags] = await db.query(
               'SELECT id, project_gallery_id, tag, created_at FROM project_gallery_tags WHERE project_gallery_id IN (?) ORDER BY created_at ASC',
               [galleryIds]
          );

          return galleries.map(gallery => ({
               ...gallery,
               photos: photos.filter(p => p.project_gallery_id === gallery.id),
               tags: tags.filter(t => t.project_gallery_id === gallery.id).map(t => t.tag)
          }));
     }

     static async getGalleryById(galleryId) {
          const [galleries] = await db.query(
               'SELECT id, project_id, title, notes, created_at, updated_at FROM project_gallery WHERE id = ? LIMIT 1',
               [galleryId]
          );

          if (galleries.length === 0) return null;

          const gallery = galleries[0];

          const [photos] = await db.query(
               'SELECT id, project_gallery_id, image_url, title, notes, gallery_status, created_at, updated_at FROM project_gallery_photos WHERE project_gallery_id = ? AND gallery_status != ? ORDER BY created_at ASC',
               [galleryId, 'deleted']
          );

          const [tags] = await db.query(
               'SELECT id, project_gallery_id, tag, created_at FROM project_gallery_tags WHERE project_gallery_id = ? ORDER BY created_at ASC',
               [galleryId]
          );

          gallery.photos = photos;
          gallery.tags = tags.map(t => t.tag);
          return gallery;
     }

     static async updateGallery(galleryId, title, notes) {
          const updates = [];
          const params = [];
          
          if (title !== undefined) {
               updates.push('title = ?');
               params.push(title);
          }
          if (notes !== undefined) {
               updates.push('notes = ?');
               params.push(notes);
          }

          if (updates.length > 0) {
               params.push(galleryId);
               await db.query(`UPDATE project_gallery SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`, params);
          }
     }

     static async deleteGallery(galleryId) {
          await db.query('DELETE FROM project_gallery WHERE id = ?', [galleryId]);
     }

     static async addPhoto(galleryId, imageUrl) {
          const [result] = await db.query(
               'INSERT INTO project_gallery_photos (project_gallery_id, image_url, gallery_status, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
               [galleryId, imageUrl, 'active']
          );
          return result.insertId;
     }
     
     static async getPhotoById(photoId) {
          const [photos] = await db.query('SELECT * FROM project_gallery_photos WHERE id = ? LIMIT 1', [photoId]);
          return photos[0] || null;
     }

     static async updatePhoto(photoId, title, notes) {
          const updates = [];
          const params = [];
          
          if (title !== undefined) {
               updates.push('title = ?');
               params.push(title);
          }
          if (notes !== undefined) {
               updates.push('notes = ?');
               params.push(notes);
          }

          if (updates.length > 0) {
               params.push(photoId);
               await db.query(`UPDATE project_gallery_photos SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`, params);
          }
     }

     static async deletePhoto(photoId) {
          await db.query('UPDATE project_gallery_photos SET gallery_status = ?, updated_at = NOW() WHERE id = ?', ['deleted', photoId]);
     }

     static async addTag(galleryId, tag) {
          try {
               const [result] = await db.query(
                    'INSERT IGNORE INTO project_gallery_tags (project_gallery_id, tag, created_at) VALUES (?, ?, NOW())',
                    [galleryId, tag]
               );
               return result.insertId;
          } catch (error) {
               throw error;
          }
     }

     static async deleteTag(galleryId, tag) {
          await db.query('DELETE FROM project_gallery_tags WHERE project_gallery_id = ? AND tag = ?', [galleryId, tag]);
     }
}

module.exports = ProjectGalleryModel;
