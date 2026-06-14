const logger = require('../../common/utils/logger');
const ReportingModel = require('../models/reportingModel');
const Bid = require('../models/bidModel');
const SystemEmployee = require('../models/systemEmployeeModel');
const { buildPagination } = require('../../common/utils/pagination');
const { sendSuccess, sendError } = require('../../common/utils/apiResponse');

const EMPLOYEE_REPORT_PAGE_SIZE = 5;

const getBootstrapData = async (req, res) => {
     try {
          const filter = req.query.filter || 'all';

          logger.info('getBootstrapData called - executing concurrent parallel bootstrap queries', {
               requestId: req.requestId,
               filter
          });

          const [bidsResult, employeesResult, dashboard] = await Promise.all([
               Bid.getBids({ page: 1, limit: 5 }),
               SystemEmployee.getEmployees({ page: 1, limit: 1000, status: 'active' }),
               ReportingModel.getDashboardSummary({ filter })
          ]);

          logger.info('Bootstrap data loaded successfully', { requestId: req.requestId });

          return sendSuccess(res, 'Bootstrap data fetched successfully', {
               bids: bidsResult.bids,
               statusCounts: bidsResult.statusCounts,
               employees: employeesResult.employees,
               dashboard,
               pagination: {
                    currentPage: 1,
                    perPage: 5,
                    totalPages: Math.ceil(bidsResult.totalRecords / 5),
                    totalRecords: bidsResult.totalRecords
               }
          });
     } catch (error) {
          logger.error('Error fetching bootstrap data', {
               requestId: req.requestId,
               error: error.message,
               stack: error.stack
          });
          return sendError(res, 500, 'Error fetching dashboard initialization data');
     }
};

const getDashboard = async (req, res) => {
     try {
          const filter = req.query.filter || 'all';
          const hours = req.query.hours;
          const dashboard = await ReportingModel.getDashboardSummary({ filter, hours });

          return sendSuccess(res, 'Reporting dashboard fetched successfully', { dashboard });
     } catch (error) {
          logger.error('Error fetching reporting dashboard', {
               requestId: req.requestId,
               error: error.message
          });
          return sendError(res, 500, 'Error fetching reporting dashboard');
     }
};

const getNoResponseClients = async (req, res) => {
     try {
          const filter = req.query.filter || 'all';
          const limit = req.query.limit || 10;
          const clients = await ReportingModel.getNoResponseClients({ filter, limit });

          return sendSuccess(res, 'No response clients fetched successfully', { clients });
     } catch (error) {
          logger.error('Error fetching no response clients', {
               requestId: req.requestId,
               error: error.message
          });
          return sendError(res, 500, 'Error fetching no response clients');
     }
};

const getEmployeeReport = async (req, res) => {
     try {
          const result = await ReportingModel.getEmployeeReport({
               page: req.query.page || 1,
               limit: EMPLOYEE_REPORT_PAGE_SIZE,
               filter: req.query.filter || 'all'
          });
          const pagination = buildPagination(result);

          return sendSuccess(res, 'Employee report fetched successfully', {
               employees: result.data,
               summary: result.summary
          }, { pagination });
     } catch (error) {
          logger.error('Error fetching employee report', {
               requestId: req.requestId,
               error: error.message
          });
          return sendError(res, 500, 'Error fetching employee report');
     }
};

const getEstimateLedger = async (req, res) => {
     try {
          const result = await ReportingModel.getEstimateLedger({
               page: req.query.page || 1,
               limit: req.query.limit || 10,
               search: req.query.search || '',
               filter: req.query.filter || 'all'
          });
          const pagination = buildPagination(result);

          return sendSuccess(res, 'Estimate ledger fetched successfully', {
               ledger: result.data
          }, { pagination });
     } catch (error) {
          logger.error('Error fetching estimate ledger', {
               requestId: req.requestId,
               error: error.message
          });
          return sendError(res, 500, 'Error fetching estimate ledger');
     }
};

module.exports = {
     getBootstrapData,
     getDashboard,
     getNoResponseClients,
     getEmployeeReport,
     getEstimateLedger
};