const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { isVendorAuthenticated } = require('../middlewares/vendorAuthMiddleware');
const { submitProposal } = require('../controllers/vendorProposalController');
const { notBidding } = require('../controllers/vendorBidActionsController');
const upload = require('../../common/middlewares/uploadMiddleware');
const { requireApprovedVendor } = require('../middlewares/vendorProjectApprovalMiddleware');

const rfiRoute = require('./rfiRoute');
const submittalRoute = require('./submittalRoute');

router.get('/', isVendorAuthenticated, dashboardController.getDashboard);
router.get('/project/:id', isVendorAuthenticated, dashboardController.getProject);
router.get('/project/:id/materials', isVendorAuthenticated, dashboardController.getProjectMaterials);
router.post('/project/:projectId/proposal', isVendorAuthenticated, upload.array('files'), submitProposal);
router.post('/project/:projectId/not-bidding', isVendorAuthenticated, notBidding);
router.use('/project/:id/rfis', isVendorAuthenticated, requireApprovedVendor, rfiRoute);
router.use('/project/:id/submittals', isVendorAuthenticated, requireApprovedVendor, submittalRoute);

module.exports = router;

