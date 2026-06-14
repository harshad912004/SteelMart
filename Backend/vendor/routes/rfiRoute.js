const express = require('express');
const router = express.Router({ mergeParams: true });
const vendorRfiController = require('../controllers/vendorRfiController');
const { isVendorAuthenticated } = require('../middlewares/vendorAuthMiddleware');
const upload = require('../../common/middlewares/uploadMiddleware');

// Base path will be: /vendor/dashboard/project/:id/rfis
router.get('/', isVendorAuthenticated, vendorRfiController.getProjectRFIs);
router.post('/', isVendorAuthenticated, vendorRfiController.createProjectRFI);
router.get('/:rfiId', isVendorAuthenticated, vendorRfiController.getProjectRFIById);
router.put('/:rfiId', isVendorAuthenticated, vendorRfiController.updateProjectRFI);
router.delete('/:rfiId', isVendorAuthenticated, vendorRfiController.deleteProjectRFI);
router.post('/:rfiId/history', isVendorAuthenticated, upload.single('file'), vendorRfiController.addProjectRFIHistory);

module.exports = router;
