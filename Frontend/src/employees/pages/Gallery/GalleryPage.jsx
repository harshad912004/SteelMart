import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './GalleryPage.module.css';
import TopTabs from '../../components/TopTabs/TopTabs';
import {
  getBidGalleries,
  createBidGallery,
  updateBidGallery,
  deleteBidGallery,
  uploadBidGalleryPhoto,
  updateBidGalleryPhoto,
  deleteBidGalleryPhoto,
  addBidGalleryTag,
  deleteBidGalleryTag
} from '../../services/api';

const TABS = [
  'Overview',
  'Grand Total',
  'Files',
  'RFIs',
  'Submittals',
  'Documents',
  'Vendors',
  'Financials & Admin',
  'Gallery',
];

const mapTabToKey = (tab) => {
  if (tab === 'Grand Total') return 'tables';
  if (tab === 'Financials & Admin') return 'financials';
  return tab.toLowerCase();
};

const EMPLOYEES = [
  { id: 'e1', name: 'Anugrah Prasetya', company: 'Aquil Tech Labs' },
  { id: 'e2', name: 'Anugrah Prasetya', company: 'SteelMart' },
  { id: 'e3', name: 'Silvia Cintia', company: 'Aquil Tech Labs' },
  { id: 'e4', name: 'Ashish Singh', company: 'Perspiciatis' },
  { id: 'e5', name: 'Ashish Singh', company: 'Doloremque' },
];

const TAG_COLORS = { '#property': styles.tagProperty, '#heavyequipment': styles.tagEquipment, '#highqualitybuild': styles.tagBuild };

const getFullImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/uploads/gallery-files/${url}`;
};

/* ── Inline SVG Icons ── */
const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
);
const PencilIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
);
const TrashIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
);
const CloseIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
);
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
);
const ShareIcon = ({ size = 18, color = '#344054' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
);
const UploadCloudIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#98A2B3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" /></svg>
);
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#98A2B3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
);
const LinkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
);
const ChevronLeftIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
);
const ChevronRightIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
);
const PersonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);
const MapPinSmallIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
);
const ExclamationIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#D92D20" strokeWidth="2" /><line x1="12" y1="8" x2="12" y2="12" stroke="#D92D20" strokeWidth="2" strokeLinecap="round" /><circle cx="12" cy="16" r="1" fill="#D92D20" /></svg>
);
const ImageIcon = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const TAG_STYLES = [styles.tagProperty, styles.tagEquipment, styles.tagBuild];

function getTagClass(tag) {
  if (TAG_COLORS[tag]) return TAG_COLORS[tag];
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  return TAG_STYLES[Math.abs(hash) % TAG_STYLES.length];
}

/* ══════════════════════════════════════════
   GALLERY PAGE COMPONENT
   ══════════════════════════════════════════ */

function GalleryPage({ hideTopTabs = false, bidId: propBidId, isCompleted = false }) {
  const { id } = useParams();
  const searchParams = new URLSearchParams(window.location.search);
  const queryBidId = searchParams.get('bid');
  const bidId = parseInt(propBidId || id || queryBidId, 10);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('Gallery');
  const [searchTerm, setSearchTerm] = useState('');
  const [groups, setGroups] = useState([]);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [hoveredPhoto, setHoveredPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchGalleries = async () => {
    try {
      setLoading(true);
      const res = await getBidGalleries(bidId);
      if (res && res.success) {
        const galleriesArray = res.galleries || (res.data && res.data.galleries);
        if (Array.isArray(galleriesArray)) {
          setGroups(galleriesArray.map(g => ({
            ...g,
            name: g.title,
            tags: g.tags || [],
            timestamp: new Date(g.created_at).toLocaleDateString(),
            photos: (g.photos || []).map(p => ({
              ...p,
              src: getFullImageUrl(p.image_url),
              timestamp: new Date(p.created_at).toLocaleDateString(),
              title: p.title || '',
              notes: p.notes || ''
            }))
          })));
        } else {
          setGroups([]);
        }
      } else {
        setGroups([]);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to load galleries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bidId) {
      fetchGalleries();
    }
  }, [bidId]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const tabKey = mapTabToKey(tab);
    navigate(`/dashboard/projects?bid=${bidId}&tab=${tabKey}`);
  };

  // Modal states
  const [editPicModal, setEditPicModal] = useState(null);
  const [editGroupModal, setEditGroupModal] = useState(null);
  const [addGalleryModal, setAddGalleryModal] = useState(false);
  const [shareModal, setShareModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  // Edit single pic form
  const [editPicTitle, setEditPicTitle] = useState('');
  const [editPicTags, setEditPicTags] = useState([]);
  const [editPicNotes, setEditPicNotes] = useState('');
  const [editPicTagInput, setEditPicTagInput] = useState('');

  // Edit group form
  const [editGroupTitle, setEditGroupTitle] = useState('');
  const [editGroupTags, setEditGroupTags] = useState([]);
  const [editGroupNotes, setEditGroupNotes] = useState('');
  const [editGroupTagInput, setEditGroupTagInput] = useState('');
  const [editGroupUploadedFiles, setEditGroupUploadedFiles] = useState([]);

  // Share form
  const [shareSearch, setShareSearch] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState(['e1', 'e4']);

  const uploadRef = useRef(null);
  const changePhotoRef = useRef(null);

  const allPhotos = groups.flatMap((g) => g.photos);
  const selectionMode = selectedPhotos.length > 0;

  /* ── Selection ── */
  const toggleSelect = (photoId) => {
    setSelectedPhotos((prev) =>
      prev.includes(photoId) ? prev.filter((id) => id !== photoId) : [...prev, photoId]
    );
  };

  const clearSelection = () => setSelectedPhotos([]);

  /* ── Edit Single Pic ── */
  const openEditPic = (photo) => {
    setEditPicModal(photo);
    setEditPicTitle(photo.title || '');
    setEditPicNotes(photo.notes || '');
  };



  /* ── Edit / Add Group ── */
  const openEditGroup = (group) => {
    setEditGroupModal(group);
    setEditGroupTitle(group.name || '');
    setEditGroupTags([...group.tags]);
    setEditGroupNotes(group.notes || '');
    setEditGroupTagInput('');
    setEditGroupUploadedFiles([]);
  };

  const openAddGallery = () => {
    setAddGalleryModal(true);
    setEditGroupTitle('');
    setEditGroupTags([]);
    setEditGroupNotes('');
    setEditGroupTagInput('');
    setEditGroupUploadedFiles([]);
  };

  const addGroupTag = () => {
    const t = editGroupTagInput.trim();
    if (t && !editGroupTags.includes(t.startsWith('#') ? t : `#${t}`)) {
      setEditGroupTags((prev) => [...prev, t.startsWith('#') ? t : `#${t}`]);
    }
    setEditGroupTagInput('');
  };

  const removeGroupTag = (tag) => {
    setEditGroupTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleUploadFiles = (e) => {
    const files = Array.from(e.target.files || []);
    const newFiles = files.map((f, i) => ({
      id: `upload-${Date.now()}-${i}`,
      name: f.name,
      file: f,
      url: URL.createObjectURL(f),
    }));
    setEditGroupUploadedFiles((prev) => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const removeUploadedFile = (id) => {
    setEditGroupUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  /* ── Share ── */
  const toggleEmployee = (id) => {
    setSelectedEmployees((prev) =>
      prev.includes(id) ? prev.filter((eid) => eid !== id) : [...prev, id]
    );
  };

  const filteredEmployees = EMPLOYEES.filter(
    (e) => e.name.toLowerCase().includes(shareSearch.toLowerCase()) || e.company.toLowerCase().includes(shareSearch.toLowerCase())
  );

  const selectedEmpNames = EMPLOYEES.filter((e) => selectedEmployees.includes(e.id)).map((e) => e.name);

  /* ── Lightbox ── */
  const openLightbox = (photo) => {
    setLightbox(photo);
  };

  const lightboxPrev = () => {
    if (!lightbox) return;
    const idx = allPhotos.findIndex((p) => p.id === lightbox.id);
    const prevIdx = idx > 0 ? idx - 1 : allPhotos.length - 1;
    setLightbox(allPhotos[prevIdx]);
  };

  const lightboxNext = () => {
    if (!lightbox) return;
    const idx = allPhotos.findIndex((p) => p.id === lightbox.id);
    const nextIdx = idx < allPhotos.length - 1 ? idx + 1 : 0;
    setLightbox(allPhotos[nextIdx]);
  };

  /* ── Search filtering ── */
  const filteredGroups = groups.map((g) => ({
    ...g,
    photos: g.photos.filter(
      (p) =>
        !searchTerm.trim() ||
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.notes || '').toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter((g) =>
    g.photos.length > 0 ||
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmitGroup = async () => {
    try {
      let currentGalleryId = editGroupModal?.id;
      if (addGalleryModal) {
        const res = await createBidGallery(bidId, { title: editGroupTitle, notes: editGroupNotes, tags: editGroupTags });
        currentGalleryId = res.gallery?.id || res.data?.gallery?.id;
      } else if (editGroupModal) {
        await updateBidGallery(bidId, currentGalleryId, { title: editGroupTitle, notes: editGroupNotes });
        const oldTags = editGroupModal.tags || [];
        const newTags = editGroupTags || [];
        const tagsToAdd = newTags.filter(t => !oldTags.includes(t));
        const tagsToRemove = oldTags.filter(t => !newTags.includes(t));
        
        for (const tag of tagsToAdd) {
          await addBidGalleryTag(bidId, currentGalleryId, tag);
        }
        for (const tag of tagsToRemove) {
          await deleteBidGalleryTag(bidId, currentGalleryId, tag);
        }
      }
      
      if (currentGalleryId && editGroupUploadedFiles.length > 0) {
        for (const fileObj of editGroupUploadedFiles) {
          if (fileObj.file) {
            await uploadBidGalleryPhoto(bidId, currentGalleryId, fileObj.file);
          }
        }
      }
      
      setEditGroupModal(null);
      setAddGalleryModal(false);
      fetchGalleries();
    } catch (err) {
      console.error(err);
      alert('Error saving group');
    }
  };

  const handleSubmitPic = async () => {
    if (!editPicModal) return;
    try {
      await updateBidGalleryPhoto(bidId, editPicModal.project_gallery_id, editPicModal.id, { 
        title: editPicTitle, 
        notes: editPicNotes 
      });
      setEditPicModal(null);
      fetchGalleries();
    } catch (err) {
      console.error(err);
      alert('Error updating photo');
    }
  };

  const [deleteContext, setDeleteContext] = useState(null); // { type: 'photo' | 'group' | 'selection', id?: number, galleryId?: number }

  const handleConfirmDelete = async () => {
    try {
      if (deleteContext?.type === 'photo') {
        await deleteBidGalleryPhoto(bidId, deleteContext.galleryId, deleteContext.id);
      } else if (deleteContext?.type === 'group') {
        await deleteBidGallery(bidId, deleteContext.id);
      } else if (deleteContext?.type === 'selection') {
        const results = await Promise.allSettled(
          selectedPhotos.map(async (photoId) => {
            const photo = allPhotos.find(p => p.id === photoId);
            if (photo) {
              await deleteBidGalleryPhoto(bidId, photo.project_gallery_id, photo.id);
            }
          })
        );
        const failed = results.filter(r => r.status === 'rejected');
        if (failed.length > 0) {
          console.error('Some deletions failed:', failed);
          alert(`Error deleting ${failed.length} photo(s).`);
        }
        clearSelection();
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting item(s)');
    } finally {
      setDeleteModal(false);
      setDeleteContext(null);
      setLightbox(null);
      fetchGalleries();
    }
  };

  return (
    <div className={styles.pageWrapper}>
      {/* Top Tabs */}
      {!hideTopTabs && <TopTabs tabs={TABS} activeTab={activeTab} onChange={handleTabChange} />}

      {/* ── Gallery Header ── */}
      <div className={styles.galleryHeader}>
        <h1 className={styles.galleryTitle}>Gallery</h1>
        <div className={styles.headerRight}>
          {/* <div style={{ position: 'relative' }}>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={searchTerm ? { paddingRight: '28px' } : undefined}
            />
            {searchTerm && (
              <button 
                type="button" 
                onClick={() => setSearchTerm('')} 
                style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#98A2B3', display: 'flex', padding: '4px' }}
              >
                <CloseIcon size={14} />
              </button>
            )}
          </div> */}
          {!isCompleted && (
            <button type="button" className={styles.addGalleryBtn} onClick={openAddGallery}>
              <PlusIcon /> Add Gallery
            </button>
          )}
        </div>
      </div>

      {/* ── Groups ── */}
      {!loading && groups.length === 0 ? (
        <div className={styles.emptyStateContainer}>
          <div className={styles.emptyStateIconWrapper}>
            <ImageIcon size={32} />
          </div>
          <h2 className={styles.emptyStateTitle}>No Images Available</h2>
          <p className={styles.emptyStateSubtitle}>
            Upload project photos to start building your gallery.
          </p>
          {!isCompleted && (
            <button type="button" className={styles.emptyStateBtn} onClick={openAddGallery}>
              <UploadCloudIcon /> Upload Images
            </button>
          )}
        </div>
      ) : (
        filteredGroups.map((group) => (
          <div key={group.id} className={styles.galleryGroup}>
          {/* Group Header */}
          <div className={styles.groupHeader}>
            <div>
              <div className={styles.groupTitleRow}>
                {selectionMode && (
                  <input
                    type="checkbox"
                    className={styles.groupCheckbox}
                    checked={group.photos.every((p) => selectedPhotos.includes(p.id))}
                    onChange={() => {
                      const allIds = group.photos.map((p) => p.id);
                      const allSelected = allIds.every((id) => selectedPhotos.includes(id));
                      setSelectedPhotos((prev) =>
                        allSelected
                          ? prev.filter((id) => !allIds.includes(id))
                          : [...new Set([...prev, ...allIds])]
                      );
                    }}
                  />
                )}
                <h2 className={styles.groupName}>{group.name}</h2>
                <span className={styles.groupTimestamp}>
                  <ClockIcon /> {group.timestamp}
                </span>
              </div>
              <div className={styles.tagsRow}>
                {group.tags.map((tag) => (
                  <span key={tag} className={`${styles.tag} ${getTagClass(tag)}`}>
                    {tag}
                  </span>
                ))}
              </div>
              {group.notes && <p className={styles.groupNotes}>Notes: {group.notes}</p>}
            </div>
            {!selectionMode && (
              <div style={{ display: 'flex', gap: '8px' }}>
                {!isCompleted && (
                  <button type="button" className={styles.editGroupBtn} onClick={() => openEditGroup(group)} aria-label="Edit group">
                    <PencilIcon size={18} color="#3047f7" />
                  </button>
                )}
                {!isCompleted && (
                  <button type="button" className={styles.editGroupBtn} style={{ borderColor: '#FEE4E2', background: '#FEF3F2' }} onClick={() => { setDeleteContext({ type: 'group', id: group.id }); setDeleteModal(true); }} aria-label="Delete group">
                    <TrashIcon size={18} color="#D92D20" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Photo Grid */}
          <div className={styles.photoGrid}>
            {group.photos.map((photo) => {
              const isSelected = selectedPhotos.includes(photo.id);
              return (
                <div
                  key={photo.id}
                  className={`${styles.photoCard} ${isSelected ? styles.photoCardSelected : ''}`}
                  onMouseEnter={() => setHoveredPhoto(photo.id)}
                  onMouseLeave={() => setHoveredPhoto(null)}
                  onClick={() => {
                    if (selectionMode) {
                      toggleSelect(photo.id);
                    } else {
                      openLightbox(photo);
                    }
                  }}
                >
                  <img src={photo.src} alt={photo.title} loading="lazy" />

                  {/* Checkbox */}
                  {(selectionMode || hoveredPhoto === photo.id) && (
                    <input
                      type="checkbox"
                      className={styles.photoCheckbox}
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleSelect(photo.id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}

                  {/* Action buttons on hover */}
                  {hoveredPhoto === photo.id && !selectionMode && (
                    <div className={styles.photoActions}>
                      {!isCompleted && (
                        <button
                          type="button"
                          className={styles.photoActionBtn}
                          title="Edit"
                          onClick={(e) => { e.stopPropagation(); openEditPic(photo); }}
                        >
                          <PencilIcon size={14} color="#344054" />
                        </button>
                      )}
                      {!isCompleted && (
                        <button
                          type="button"
                          className={styles.photoActionBtn}
                          title="Delete"
                          onClick={(e) => { e.stopPropagation(); setDeleteContext({ type: 'photo', id: photo.id, galleryId: group.id }); setDeleteModal(true); }}
                        >
                          <TrashIcon size={14} color="#D92D20" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Hover overlay (only on specific card like design shows) */}
                  {hoveredPhoto === photo.id && !selectionMode && (
                    <div className={styles.photoOverlay}>
                      <span className={styles.overlayTimestamp}>
                        <ClockIcon /> {photo.timestamp}
                      </span>
                      <p className={styles.overlayTitle}>{photo.title}</p>
                      <p className={styles.overlayNotes}>Notes: {photo.notes}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        ))
      )}

      {/* ── Selection Action Bar ── */}
      {selectionMode && (
        <div className={styles.selectionBar}>
          <span className={styles.selectedCount}>
            {selectedPhotos.length} Selected
            <button type="button" className={styles.selectedCountClose} onClick={clearSelection}>
              <CloseIcon size={14} />
            </button>
          </span>
          <button type="button" className={styles.selectionAction} onClick={() => setShareModal(true)}>
            <ShareIcon size={16} color="#344054" /> Share
          </button>
          <button type="button" className={styles.selectionAction} onClick={() => { setDeleteContext({ type: 'selection' }); setDeleteModal(true); }}>
            <TrashIcon size={16} color="#344054" /> Delete
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════
         EDIT SINGLE PIC MODAL
         ══════════════════════════════════════ */}
      {editPicModal && (
        <div className={styles.modalOverlay} onClick={() => setEditPicModal(null)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Edit Single pic title</h3>
              <button type="button" className={styles.modalClose} onClick={() => setEditPicModal(null)}>
                <CloseIcon />
              </button>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Title</label>
              <input className={styles.fieldInput} value={editPicTitle} onChange={(e) => setEditPicTitle(e.target.value)} placeholder="Single pic title" />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Notes</label>
              <input className={styles.fieldInput} value={editPicNotes} onChange={(e) => setEditPicNotes(e.target.value)} placeholder="Enter photo notes" />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Change Photo</label>
              <div className={styles.changePhotoWrap}>
                <img src={editPicModal.src} alt="Current" />
                <button type="button" className={styles.changePhotoBtn} onClick={() => changePhotoRef.current?.click()}>
                  <PencilIcon size={14} color="#344054" />
                </button>
                <input type="file" ref={changePhotoRef} style={{ display: 'none' }} accept="image/*" />
              </div>
            </div>

            <button type="button" className={styles.submitBtn} onClick={handleSubmitPic}>Submit</button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
         EDIT GROUP / ADD GALLERY MODAL
         ══════════════════════════════════════ */}
      {(editGroupModal || addGalleryModal) && (
        <div className={styles.modalOverlay} onClick={() => { setEditGroupModal(null); setAddGalleryModal(false); }}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{addGalleryModal ? 'Add Gallery' : 'Edit Group Title'}</h3>
              <button type="button" className={styles.modalClose} onClick={() => { setEditGroupModal(null); setAddGalleryModal(false); }}>
                <CloseIcon />
              </button>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Title</label>
              <input className={styles.fieldInput} value={editGroupTitle} onChange={(e) => setEditGroupTitle(e.target.value)} placeholder="Enter Title" />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Tags</label>
              <div className={styles.tagsInputWrap}>
                {editGroupTags.map((tag) => (
                  <span key={tag} className={`${styles.tagChip} ${getTagClass(tag)}`}>
                    {tag}
                    <button type="button" className={styles.tagChipRemove} onClick={() => removeGroupTag(tag)}>×</button>
                  </span>
                ))}
                <input
                  type="text"
                  className={styles.tagsInputField}
                  placeholder="Type a tag and press Enter"
                  value={editGroupTagInput}
                  onChange={(e) => setEditGroupTagInput(e.target.value)}
                  onKeyDown={(e) => { 
                    if (e.key === 'Enter' || e.key === ',') { 
                      e.preventDefault(); 
                      addGroupTag(); 
                    } 
                  }}
                />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Notes</label>
              <input className={styles.fieldInput} value={editGroupNotes} onChange={(e) => setEditGroupNotes(e.target.value)} placeholder="Enter Notes" />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Upload Photo</label>
              <div className={styles.uploadArea} onClick={() => uploadRef.current?.click()}>
                <div className={styles.uploadIcon}><UploadCloudIcon /></div>
                <p className={styles.uploadText}>
                  Drag your file or <span className={styles.uploadBrowse}>browse</span>
                </p>
                <p className={styles.uploadFormats}>JPG, JPEG and PNG formats</p>
              </div>
              <input type="file" ref={uploadRef} style={{ display: 'none' }} accept="image/jpg,image/jpeg,image/png" multiple onChange={handleUploadFiles} />

              {editGroupUploadedFiles.length > 0 && (
                <div className={styles.uploadThumbs}>
                  {editGroupUploadedFiles.map((f) => (
                    <div key={f.id} className={styles.uploadThumb}>
                      <img src={f.url} alt={f.name} />
                      <button type="button" className={styles.uploadThumbRemove} onClick={() => removeUploadedFile(f.id)}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button type="button" className={styles.submitBtn} onClick={handleSubmitGroup}>Submit</button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
         SHARE MODAL
         ══════════════════════════════════════ */}
      {shareModal && (
        <div className={styles.modalOverlay} onClick={() => setShareModal(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.shareHeader}>
              <div className={styles.shareHeaderLeft}>
                <h3 className={styles.shareTitle}>Share</h3>
                <button type="button" className={styles.copyLinkBtn}>
                  <LinkIcon /> Copy Link
                </button>
              </div>
              <button type="button" className={styles.modalClose} onClick={() => setShareModal(false)}>
                <CloseIcon />
              </button>
            </div>

            <p className={styles.shareSubtitle}>Select a employee or company name</p>

            <div className={styles.shareSearchWrap}>
              <span className={styles.shareSearchIcon}><SearchIcon /></span>
              <input
                className={styles.shareSearchInput}
                placeholder="Search"
                value={shareSearch}
                onChange={(e) => setShareSearch(e.target.value)}
                style={{ paddingLeft: 36 }}
              />
            </div>

            <div className={styles.employeeList}>
              {filteredEmployees.map((emp) => (
                <div key={emp.id} className={styles.employeeItem} onClick={() => toggleEmployee(emp.id)}>
                  <input
                    type="checkbox"
                    className={styles.employeeCheckbox}
                    checked={selectedEmployees.includes(emp.id)}
                    onChange={() => toggleEmployee(emp.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className={styles.employeeName}>{emp.name}</span>
                  <span className={styles.employeeSep}>|</span>
                  <span className={styles.employeeCompany}>{emp.company}</span>
                </div>
              ))}
            </div>

            {/* {selectedEmpNames.length > 0 && (
              <div className={styles.sendingTo}>
                <span className={styles.sendingToLabel}>Sending Mail To: </span>
                <span className={styles.sendingToNames}>{selectedEmpNames.join(', ')}</span>
                <p className={styles.ccNote}>Please note that all selected employee will be CC&apos;d in one mail</p>
              </div>
            )} */}

            <button type="button" className={styles.sendEmailBtn} onClick={() => setShareModal(false)}>Send Email</button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
         DELETE CONFIRMATION MODAL
         ══════════════════════════════════════ */}
      {deleteModal && (
        <div className={styles.modalOverlay} onClick={() => setDeleteModal(false)}>
          <div className={styles.deleteModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.deleteIcon}>
              <ExclamationIcon />
            </div>
            <p className={styles.deleteText}>Are you sure you want to delete?</p>
            <div className={styles.deleteActions}>
              <button type="button" className={styles.cancelBtn} onClick={() => { setDeleteModal(false); setDeleteContext(null); }}>Cancel</button>
              <button type="button" className={styles.proceedBtn} onClick={handleConfirmDelete}>Proceed</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
         LIGHTBOX
         ══════════════════════════════════════ */}
      {lightbox && (() => {
        const lightboxGroup = groups.find(g => g.id === lightbox.project_gallery_id);
        const tags = lightboxGroup ? lightboxGroup.tags : [];
        return (
        <div className={styles.lightboxOverlay} onClick={() => setLightbox(null)}>
          {/* Header */}
          <div className={styles.lightboxHeader} onClick={(e) => e.stopPropagation()}>
            <div className={styles.lightboxTitleSection}>
              <h2 className={styles.lightboxTitle}>{lightbox.title || lightboxGroup?.name || 'Untitled'}</h2>
              <div className={styles.lightboxMeta}>
                <span className={styles.lightboxMetaItem}><ClockIcon /> {lightbox.timestamp}</span>
              </div>
              {tags.length > 0 && (
                <div className={styles.lightboxTags}>
                  {tags.map((tag) => (
                    <span key={tag} className={`${styles.tag} ${getTagClass(tag)}`}>{tag}</span>
                  ))}
                </div>
              )}
            </div>
            <div className={styles.lightboxActions}>
              <button type="button" className={styles.lightboxActionBtn} title="Edit" onClick={() => { setLightbox(null); openEditPic(lightbox); }}>
                <PencilIcon size={18} color="#fff" />
              </button>
              <button type="button" className={styles.lightboxActionBtn} title="Share" onClick={() => { setShareModal(true); }}>
                <ShareIcon size={18} color="#fff" />
              </button>
              <button type="button" className={styles.lightboxActionBtn} title="Delete" onClick={() => { setDeleteContext({ type: 'photo', id: lightbox.id, galleryId: lightbox.project_gallery_id }); setDeleteModal(true); }}>
                <TrashIcon size={18} color="#fff" />
              </button>
              <button type="button" className={styles.lightboxActionBtn} title="Close" onClick={() => setLightbox(null)}>
                <CloseIcon size={18} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className={styles.lightboxBody} onClick={(e) => e.stopPropagation()}>
            <button type="button" className={`${styles.lightboxArrow} ${styles.lightboxArrowLeft}`} onClick={lightboxPrev}>
              <ChevronLeftIcon />
            </button>
            <img src={lightbox.src} alt={lightbox.title} className={styles.lightboxImage} />
            <button type="button" className={`${styles.lightboxArrow} ${styles.lightboxArrowRight}`} onClick={lightboxNext}>
              <ChevronRightIcon />
            </button>
          </div>

          {/* Footer */}
          <div className={styles.lightboxFooter} onClick={(e) => e.stopPropagation()}>
            Notes: {lightbox.notes || 'No notes available.'}
          </div>
        </div>
        );
      })()}
    </div>
  );
}

export default GalleryPage;

