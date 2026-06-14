const express = require('express');
const router = express.Router();
const systemEmployeeController = require('../controllers/systemEmployeeController');
const bidController = require('../controllers/bidController');
const bidCostDetailController = require('../controllers/bidCostDetailController');
const bidFolderFileController = require('../controllers/bidFolderFileController');
const reportingController = require('../controllers/reportingController');
const personnelTeamController = require('../controllers/personnelTeamController');
const projectGalleryController = require('../controllers/projectGalleryController');
const rfiController = require('../controllers/rfiController');
const submittalController = require('../controllers/submittalController');
const financialsAdminController = require('../controllers/financialsAdminController');
const { isAuthenticated } = require('../middlewares/authMiddleware');
const {
     validateRequest,
     validateSystemEmployeeCreate,
     validateSystemEmployeeUpdate,
     validateIdParam,
     validateMultiIdParam
} = require('../../common/utils/formValidators');

router.use(isAuthenticated);

router.get('/getEmployees', systemEmployeeController.getEmployees);
router.get('/viewEmployee/:id', validateIdParam('id', 'Employee ID'), validateRequest, systemEmployeeController.viewEmployee);
router.post('/addEmployee', validateSystemEmployeeCreate, validateRequest, systemEmployeeController.addEmployee);
router.put('/updateEmployee/:id', validateSystemEmployeeUpdate, validateRequest, systemEmployeeController.updateEmployee);
router.delete('/deleteEmployee/:id', validateIdParam('id', 'Employee ID'), validateRequest, systemEmployeeController.deleteEmployee);
router.post('/undeleteEmployee/:id', validateIdParam('id', 'Employee ID'), validateRequest, systemEmployeeController.undeleteEmployee);
router.post('/blockEmployee/:id', validateIdParam('id', 'Employee ID'), validateRequest, systemEmployeeController.blockEmployee);
router.post('/unblockEmployee/:id', validateIdParam('id', 'Employee ID'), validateRequest, systemEmployeeController.unblockEmployee);
router.post('/activeEmployee/:id', validateIdParam('id', 'Employee ID'), validateRequest, systemEmployeeController.activeEmployee);
router.post('/inactiveEmployee/:id', validateIdParam('id', 'Employee ID'), validateRequest, systemEmployeeController.inactiveEmployee);

router.get('/getBids', bidController.getBids);
router.get('/getDueSoon', bidController.getDueSoon);
router.get('/viewBid/:id', validateIdParam('id', 'Bid ID'), validateRequest, bidController.viewBid);
router.post('/createBid', bidController.createBid);
router.put('/updateBid/:id', validateIdParam('id', 'Bid ID'), validateRequest, bidController.updateBid);
router.delete('/deleteBid/:id', validateIdParam('id', 'Bid ID'), validateRequest, bidController.deleteBid);
router.post('/archiveBid/:id', validateIdParam('id', 'Bid ID'), validateRequest, bidController.archiveBid);
router.post('/unarchiveBid/:id', validateIdParam('id', 'Bid ID'), validateRequest, bidController.unarchiveBid);
router.post('/pinBid/:id', validateIdParam('id', 'Bid ID'), validateRequest, bidController.pinBid);
router.post('/unpinBid/:id', validateIdParam('id', 'Bid ID'), validateRequest, bidController.unpinBid);

router.post('/bids/:bidId/folders', validateIdParam('bidId', 'Bid ID'), validateRequest, bidFolderFileController.createFolder);
router.get('/bids/:bidId/folders', validateIdParam('bidId', 'Bid ID'), validateRequest, bidFolderFileController.viewBidFolders);
router.get('/bids/:bidId/files', validateIdParam('bidId', 'Bid ID'), validateRequest, bidFolderFileController.viewBidRootFiles);
router.post('/bids/:bidId/files', validateIdParam('bidId', 'Bid ID'), validateRequest, express.raw({ type: () => true, limit: '25mb' }), bidFolderFileController.uploadRootFile);
router.delete('/bids/:bidId/folders/:folderId', validateMultiIdParam([
     { name: 'bidId', label: 'Bid ID' },
     { name: 'folderId', label: 'Folder ID' }
]), validateRequest, bidFolderFileController.deleteBidFolder);
router.put('/bids/:bidId/folders/:folderId', validateMultiIdParam([
     { name: 'bidId', label: 'Bid ID' },
     { name: 'folderId', label: 'Folder ID' }
]), validateRequest, bidFolderFileController.renameFolder);

router.post('/bids/:bidId/folders/:folderId/files', validateMultiIdParam([
     { name: 'bidId', label: 'Bid ID' },
     { name: 'folderId', label: 'Folder ID' }
]), validateRequest, express.raw({ type: () => true, limit: '25mb' }), bidFolderFileController.uploadFile);
router.get('/bids/:bidId/folders/:folderId/files', validateMultiIdParam([
     { name: 'bidId', label: 'Bid ID' },
     { name: 'folderId', label: 'Folder ID' }
]), validateRequest, bidFolderFileController.viewFolderFiles);
router.get('/bids/:bidId/folders/:folderId/files/:fileId/download', validateMultiIdParam([
     { name: 'bidId', label: 'Bid ID' },
     { name: 'folderId', label: 'Folder ID' },
     { name: 'fileId', label: 'File ID' }
]), validateRequest, bidFolderFileController.downloadFile);
router.delete('/bids/:bidId/folders/:folderId/files/:fileId', validateMultiIdParam([
     { name: 'bidId', label: 'Bid ID' },
     { name: 'folderId', label: 'Folder ID' },
     { name: 'fileId', label: 'File ID' }
]), validateRequest, bidFolderFileController.deleteFile);
router.put('/bids/:bidId/folders/:folderId/files/:fileId', validateMultiIdParam([
     { name: 'bidId', label: 'Bid ID' },
     { name: 'folderId', label: 'Folder ID' },
     { name: 'fileId', label: 'File ID' }
]), validateRequest, bidFolderFileController.renameFile);

router.get('/getCostDetails/:id', validateIdParam('id', 'Bid ID'), validateRequest, bidCostDetailController.getCostDetails);
router.post('/saveCostDetails/:id', validateIdParam('id', 'Bid ID'), validateRequest, bidCostDetailController.saveCostDetails);
router.get('/previewEstimate/:id', validateIdParam('id', 'Bid ID'), validateRequest, bidCostDetailController.previewEstimatePDF);
router.get('/downloadEstimate/:id', validateIdParam('id', 'Bid ID'), validateRequest, bidCostDetailController.downloadEstimatePDF);
router.post('/sendEstimate/:id', validateIdParam('id', 'Bid ID'), validateRequest, bidCostDetailController.sendEstimatePDF);

router.get('/bids/:bidId/personnel-teams/employees', validateIdParam('bidId', 'Bid ID'), validateRequest, personnelTeamController.getPersonnelEmployees);
router.get('/bids/:bidId/personnel-teams', validateIdParam('bidId', 'Bid ID'), validateRequest, personnelTeamController.getTeams);
router.post('/bids/:bidId/personnel-teams', validateIdParam('bidId', 'Bid ID'), validateRequest, personnelTeamController.createTeam);
router.put('/bids/:bidId/personnel-teams/:teamId', validateMultiIdParam([
     { name: 'bidId', label: 'Bid ID' },
     { name: 'teamId', label: 'Team ID' }
]), validateRequest, personnelTeamController.updateTeam);
router.delete('/bids/:bidId/personnel-teams/:teamId', validateMultiIdParam([
     { name: 'bidId', label: 'Bid ID' },
     { name: 'teamId', label: 'Team ID' }
]), validateRequest, personnelTeamController.deleteTeam);

router.get('/reporting/dashboard', reportingController.getDashboard);
router.get('/reporting/no-response-clients', reportingController.getNoResponseClients);
router.get('/reporting/employees', reportingController.getEmployeeReport);
router.get('/reporting/estimate-ledger', reportingController.getEstimateLedger);
router.get('/bootstrap', reportingController.getBootstrapData);

router.get('/bids/:bidId/gallery', validateIdParam('bidId', 'Bid ID'), validateRequest, projectGalleryController.getGalleries);
router.post('/bids/:bidId/gallery', validateIdParam('bidId', 'Bid ID'), validateRequest, projectGalleryController.createGallery);
router.put('/bids/:bidId/gallery/:galleryId', validateMultiIdParam([
     { name: 'bidId', label: 'Bid ID' },
     { name: 'galleryId', label: 'Gallery ID' }
]), validateRequest, projectGalleryController.updateGallery);
router.delete('/bids/:bidId/gallery/:galleryId', validateMultiIdParam([
     { name: 'bidId', label: 'Bid ID' },
     { name: 'galleryId', label: 'Gallery ID' }
]), validateRequest, projectGalleryController.deleteGallery);
router.post('/bids/:bidId/gallery/:galleryId/photos', validateMultiIdParam([
     { name: 'bidId', label: 'Bid ID' },
     { name: 'galleryId', label: 'Gallery ID' }
]), validateRequest, express.raw({ type: () => true, limit: '25mb' }), projectGalleryController.uploadPhoto);
router.put('/bids/:bidId/gallery/:galleryId/photos/:photoId', validateMultiIdParam([
     { name: 'bidId', label: 'Bid ID' },
     { name: 'galleryId', label: 'Gallery ID' },
     { name: 'photoId', label: 'Photo ID' }
]), validateRequest, projectGalleryController.updatePhoto);
router.delete('/bids/:bidId/gallery/:galleryId/photos/:photoId', validateMultiIdParam([
     { name: 'bidId', label: 'Bid ID' },
     { name: 'galleryId', label: 'Gallery ID' },
     { name: 'photoId', label: 'Photo ID' }
]), validateRequest, projectGalleryController.deletePhoto);
router.post('/bids/:bidId/gallery/:galleryId/tags', validateMultiIdParam([
     { name: 'bidId', label: 'Bid ID' },
     { name: 'galleryId', label: 'Gallery ID' }
]), validateRequest, projectGalleryController.addTag);
router.delete('/bids/:bidId/gallery/:galleryId/tags/:tag', validateMultiIdParam([
     { name: 'bidId', label: 'Bid ID' },
     { name: 'galleryId', label: 'Gallery ID' }
]), validateRequest, projectGalleryController.deleteTag);

// --- RFI Routes ---
router.get('/rfis-projects', rfiController.getProjectsWithRFIs);
router.get('/bids/:bidId/rfis', validateIdParam('bidId', 'Bid ID'), validateRequest, rfiController.getRFIs);
router.post('/bids/:bidId/rfis', validateIdParam('bidId', 'Bid ID'), validateRequest, rfiController.createRFI);
router.get('/bids/:bidId/rfis/:rfiId', validateMultiIdParam([{ name: 'bidId', label: 'Bid ID' }, { name: 'rfiId', label: 'RFI ID' }]), validateRequest, rfiController.getRFI);
router.put('/bids/:bidId/rfis/:rfiId', validateMultiIdParam([{ name: 'bidId', label: 'Bid ID' }, { name: 'rfiId', label: 'RFI ID' }]), validateRequest, rfiController.updateRFI);
router.delete('/bids/:bidId/rfis/:rfiId', validateMultiIdParam([{ name: 'bidId', label: 'Bid ID' }, { name: 'rfiId', label: 'RFI ID' }]), validateRequest, rfiController.deleteRFI);
router.post('/bids/:bidId/rfis/:rfiId/history', validateMultiIdParam([{ name: 'bidId', label: 'Bid ID' }, { name: 'rfiId', label: 'RFI ID' }]), validateRequest, express.raw({ type: () => true, limit: '25mb' }), rfiController.addHistory);
router.delete('/bids/:bidId/rfis/:rfiId/history/:historyId', validateMultiIdParam([{ name: 'bidId', label: 'Bid ID' }, { name: 'rfiId', label: 'RFI ID' }, { name: 'historyId', label: 'History ID' }]), validateRequest, rfiController.deleteHistory);

// --- Submittal Routes ---
router.get('/submittals-projects', submittalController.getProjectsWithSubmittals);
router.get('/bids/:bidId/submittals', validateIdParam('bidId', 'Bid ID'), validateRequest, submittalController.getSubmittals);
router.post('/bids/:bidId/submittals', validateIdParam('bidId', 'Bid ID'), validateRequest, submittalController.createSubmittal);
router.get('/bids/:bidId/submittals/:submittalId', validateMultiIdParam([{ name: 'bidId', label: 'Bid ID' }, { name: 'submittalId', label: 'Submittal ID' }]), validateRequest, submittalController.getSubmittal);
router.put('/bids/:bidId/submittals/:submittalId', validateMultiIdParam([{ name: 'bidId', label: 'Bid ID' }, { name: 'submittalId', label: 'Submittal ID' }]), validateRequest, submittalController.updateSubmittal);
router.delete('/bids/:bidId/submittals/:submittalId', validateMultiIdParam([{ name: 'bidId', label: 'Bid ID' }, { name: 'submittalId', label: 'Submittal ID' }]), validateRequest, submittalController.deleteSubmittal);
router.post('/bids/:bidId/submittals/:submittalId/versions', validateMultiIdParam([{ name: 'bidId', label: 'Bid ID' }, { name: 'submittalId', label: 'Submittal ID' }]), validateRequest, express.raw({ type: () => true, limit: '25mb' }), submittalController.addVersion);
router.post('/bids/:bidId/submittals/:submittalId/versions/:versionId/replies', validateMultiIdParam([{ name: 'bidId', label: 'Bid ID' }, { name: 'submittalId', label: 'Submittal ID' }, { name: 'versionId', label: 'Version ID' }]), validateRequest, submittalController.addReply);
router.put('/bids/:bidId/submittals/:submittalId/versions/:versionId', validateMultiIdParam([{ name: 'bidId', label: 'Bid ID' }, { name: 'submittalId', label: 'Submittal ID' }, { name: 'versionId', label: 'Version ID' }]), validateRequest, submittalController.updateReply);
router.delete('/bids/:bidId/submittals/:submittalId/versions/:versionId', validateMultiIdParam([{ name: 'bidId', label: 'Bid ID' }, { name: 'submittalId', label: 'Submittal ID' }, { name: 'versionId', label: 'Version ID' }]), validateRequest, submittalController.deleteVersion);

// --- Financials & Admin Routes ---
router.get('/bids/:id/financials', validateIdParam('id', 'Bid ID'), validateRequest, financialsAdminController.getFinancialsData);
router.put('/bids/:id/financials/expenses', validateIdParam('id', 'Bid ID'), validateRequest, financialsAdminController.updateExpenses);
router.post('/bids/:id/financials/change-orders', validateIdParam('id', 'Bid ID'), validateRequest, financialsAdminController.addChangeOrder);
router.put('/bids/:id/financials/change-orders/status', validateRequest, financialsAdminController.updateChangeOrderStatus);
router.post('/bids/:id/financials/payments', validateIdParam('id', 'Bid ID'), validateRequest, financialsAdminController.addPayment);
router.post('/bids/:id/financials/compliance', validateIdParam('id', 'Bid ID'), validateRequest, financialsAdminController.addComplianceDocument);
router.put('/bids/:id/financials/compliance/status', validateRequest, financialsAdminController.updateComplianceDocumentStatus);

// --- Vendor Bid Management Routes ---
const vendorBidController = require('../controllers/vendorBidController');
router.get('/bids/:bidId/vendors', validateIdParam('bidId', 'Bid ID'), validateRequest, vendorBidController.getBidVendors);
router.get('/bids/:bidId/vendors/available', validateIdParam('bidId', 'Bid ID'), validateRequest, vendorBidController.getAvailableVendors);
router.post('/bids/:bidId/vendors', validateIdParam('bidId', 'Bid ID'), validateRequest, vendorBidController.inviteVendorsToBid);
router.post('/bids/:bidId/vendors/external', validateIdParam('bidId', 'Bid ID'), validateRequest, vendorBidController.addExternalVendor);
router.post('/bids/:bidId/vendors/:vendorEntryId/approve', validateMultiIdParam([{ name: 'bidId', label: 'Bid ID' }, { name: 'vendorEntryId', label: 'Vendor Entry ID' }]), validateRequest, vendorBidController.approveVendorProposal);
router.post('/bids/:bidId/vendors/:vendorEntryId/reject', validateMultiIdParam([{ name: 'bidId', label: 'Bid ID' }, { name: 'vendorEntryId', label: 'Vendor Entry ID' }]), validateRequest, vendorBidController.rejectVendorProposal);
router.delete('/bids/:bidId/vendors/:vendorEntryId', validateMultiIdParam([{ name: 'bidId', label: 'Bid ID' }, { name: 'vendorEntryId', label: 'Vendor Entry ID' }]), validateRequest, vendorBidController.removeVendorFromBid);
router.post('/bids/:bidId/complete', validateIdParam('bidId', 'Bid ID'), validateRequest, vendorBidController.completeProject);

module.exports = router;