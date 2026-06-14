const express = require('express');
const router = express.Router({ mergeParams: true });
const vendorSubmittalController = require('../controllers/vendorSubmittalController');
const { isVendorAuthenticated } = require('../middlewares/vendorAuthMiddleware');
const upload = require('../../common/middlewares/uploadMiddleware');

// Base path will be: /vendor/dashboard/project/:id/submittals
router.get('/', isVendorAuthenticated, vendorSubmittalController.getProjectSubmittals);
router.post('/', isVendorAuthenticated, vendorSubmittalController.createProjectSubmittal);
router.get('/:submittalId', isVendorAuthenticated, vendorSubmittalController.getProjectSubmittalById);
router.put('/:submittalId', isVendorAuthenticated, vendorSubmittalController.updateProjectSubmittal);
router.delete('/:submittalId', isVendorAuthenticated, vendorSubmittalController.deleteProjectSubmittal);
router.post('/:submittalId/versions', isVendorAuthenticated, upload.single('file'), vendorSubmittalController.addProjectSubmittalVersion);
router.post('/:submittalId/versions/:versionId/replies', isVendorAuthenticated, vendorSubmittalController.addProjectSubmittalReply);

module.exports = router;
