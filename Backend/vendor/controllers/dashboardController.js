const logger = require('../../common/utils/logger');
const { sendSuccess, sendError } = require('../../common/utils/apiResponse');
const VendorDashboard = require('../models/dashboardModel');
const BidCostDetailModel = require('../../employee/models/bidCostDetailModel');

const getDashboard = async (req, res) => {
     try {
          const dashboard = await VendorDashboard.getDashboard(req.user);
          return sendSuccess(res, 'Vendor dashboard fetched successfully', dashboard);
     } catch (error) {
          logger.error('Error fetching vendor dashboard', {
               requestId: req.requestId,
               error: error.message
          });
          return sendError(res, 500, 'Error fetching vendor dashboard');
     }
};

const getProject = async (req, res) => {
     try {
          const projectId = Number(req.params.id);
          if (!Number.isInteger(projectId) || projectId <= 0) {
               return sendError(res, 400, 'Invalid project ID');
          }

          const project = await VendorDashboard.getProjectById(req.user, projectId);
          if (!project) {
               return sendError(res, 404, 'Project not found or access denied');
          }

          return sendSuccess(res, 'Project fetched successfully', { project });
     } catch (error) {
          logger.error('Error fetching vendor project', {
               requestId: req.requestId,
               error: error.message
          });
          return sendError(res, 500, 'Error fetching project details');
     }
};

const getProjectMaterials = async (req, res) => {
     try {
          const projectId = Number(req.params.id);
          if (!Number.isInteger(projectId) || projectId <= 0) {
               return sendError(res, 400, 'Invalid project ID');
          }

          // Ensure vendor actually has access to this project
          const project = await VendorDashboard.getProjectById(req.user, projectId);
          if (!project) {
               return sendError(res, 404, 'Project not found or access denied');
          }

          const details = await BidCostDetailModel.getCostDetailsByBidId(projectId);
          
          let items = [];
          let sub_total = 0;
          let grand_total = 0;

          if (details && details.length > 0) {
               if (details.length === 1 && Array.isArray(details[0]?.items)) {
                    items = details[0].items;
                    sub_total = Number(details[0].sub_total) || 0;
                    grand_total = Number(details[0].grand_total) || 0;
               } else {
                    items = details;
                    sub_total = Number(details[0]?.sub_total) || 0;
                    grand_total = Number(details[0]?.grand_total) || 0;
               }
          }

          return sendSuccess(res, 'Project materials fetched successfully', {
               items,
               sub_total,
               grand_total
          });
     } catch (error) {
          logger.error('Error fetching project materials', {
               requestId: req.requestId,
               error: error.message
          });
          return sendError(res, 500, 'Error fetching project materials');
     }
};

module.exports = {
     getDashboard,
     getProject,
     getProjectMaterials
};
