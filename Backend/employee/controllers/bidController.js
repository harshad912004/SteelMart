const db = require('../../config/db');
const logger = require('../../common/utils/logger');
const { formatDate, formatDateTime } = require('../../common/utils/dateFormatter');
const Bid = require('../models/bidModel');
const { sendSuccess, sendError, sendCreated, sendValidationError } = require('../../common/utils/apiResponse');

const PAGE_SIZE = 5;
const VALID_STATUS = ['approved', 'bidInProgress', 'sentToClient', 'lost', 'won', 'archived', 'deleted'];

// Forward-only bid_status transition map — states cannot be reverted
const ALLOWED_BID_STATUS_TRANSITIONS = {
     bidinprogress: ['senttoclient', 'deleted'],
     senttoclient: ['approved', 'lost', 'deleted'],
     approved: ['won', 'lost', 'deleted'],
     won: ['deleted'],
     lost: [],      // terminal
     deleted: [],   // terminal
};

const validateBidStatusTransition = (currentStatus, nextStatus) => {
     const normalizedCurrent = String(currentStatus || 'bidInProgress').toLowerCase();
     const normalizedNext = String(nextStatus || '').toLowerCase();
     if (normalizedCurrent === normalizedNext) return null; // no-op
     const allowed = ALLOWED_BID_STATUS_TRANSITIONS[normalizedCurrent];
     if (!allowed) return `Cannot change status from '${currentStatus}' — it is a terminal state.`;
     if (!allowed.includes(normalizedNext)) {
          return `Invalid status transition: '${currentStatus}' → '${nextStatus}'. Allowed transitions: ${allowed.join(', ') || 'none'}.`;
     }
     return null; // valid transition
};

const getBidId = (req) => {
     const body = req.body || {};
     const id = req.params.id || req.query.id || body.id || body.bid_id;
     const bidId = Number(id);
     return Number.isInteger(bidId) && bidId > 0 ? bidId : null;
};

const normalizeClientIds = (value) => {
     if (Array.isArray(value)) {
          return value
               .map((id) => Number(id))
               .filter((id) => Number.isInteger(id) && id > 0);
     }

     if (value && typeof value === 'object') {
          return Object.values(value)
               .flatMap((entry) => normalizeClientIds(entry));
     }

     if (typeof value === 'string') {
          return value
               .split(',')
               .map((id) => Number(id.trim()))
               .filter((id) => Number.isInteger(id) && id > 0);
     }

     if (typeof value === 'number' && Number.isInteger(value) && value > 0) { return [value]; }
     return [];
};

const normalizeClientEmployeeIds = (value) => {
     if (Array.isArray(value)) {
          return value
               .map((id) => Number(id))
               .filter((id) => Number.isInteger(id) && id > 0);
     }

     if (value && typeof value === 'object') {
          return Object.values(value)
               .flatMap((entry) => normalizeClientEmployeeIds(entry));
     }

     if (typeof value === 'string') {
          return value
               .split(',')
               .map((id) => Number(id.trim()))
               .filter((id) => Number.isInteger(id) && id > 0);
     }

     if (typeof value === 'number' && Number.isInteger(value) && value > 0) { return [value]; }
     return [];
};

const normalizeBooleanFlag = (value) => {
     if (value === undefined) return undefined;
     if (value === true || value === 1) return 1;
     if (value === false || value === 0 || value === null || value === '') return 0;
     const normalized = String(value).trim().toLowerCase();
     return ['1', 'true', 'yes', 'y', 'on'].includes(normalized) ? 1 : 0;
};

const normalizeAmount = (value) => {
     if (value === undefined || value === null || value === '') return null;
     const amount = Number(value);
     return Number.isFinite(amount) ? amount : value;
};

const normalizeVendorEmployeeSelections = (value) => {
     if (!Array.isArray(value)) {
          return undefined;
     }

     return value
          .filter((item) => item?.isEmployee !== false)
          .map((item) => ({
               id: Number(typeof item === 'object' ? item.id || item.employee_id || item.client_employee_id : item),
               client_employee_id: Number(typeof item === 'object' ? item.id || item.employee_id || item.client_employee_id : item),
               vendor_id: Number(typeof item === 'object' ? item.vendorId || item.vendor_id || item.client_id : null),
               vendor_category: typeof item === 'object' ? item.vendor_category || item.category || item.designation || null : null
          }))
          .filter((item) => Number.isInteger(item.client_employee_id) && item.client_employee_id > 0);
};

const normalizePlanText = (value) => {
     if (value === undefined || value === null) return null;

     if (typeof value === 'string') {
          const trimmed = value.trim();
          if (!trimmed) return null;

          if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
               try {
                    return normalizePlanText(JSON.parse(trimmed));
               } catch (error) {
                    return trimmed;
               }
          }

          return trimmed;
     }

     if (Array.isArray(value)) {
          const text = value
               .map((item) => normalizePlanText(item))
               .filter(Boolean)
               .join(', ');
          return text || null;
     }

     if (typeof value === 'object') {
          const textValue = value.label ?? value.value ?? value.name ?? value.text ?? value.title;
          if (textValue !== undefined) return normalizePlanText(textValue);

          const text = Object.values(value)
               .map((item) => normalizePlanText(item))
               .filter(Boolean)
               .join(', ');
          return text || null;
     }

     return String(value).trim() || null;
};

const hasValidNonNegativeAmount = (value) => {
     const amount = Number(value);
     return value !== undefined && value !== null && value !== '' && Number.isFinite(amount) && amount >= 0;
};

const getCurrentBidClientIds = (bid) => bid.clients.map((client) => Number(client.client_id));

const getCurrentBidEmployeeIds = (bid) => bid.clients.flatMap((client) =>
     (client.employees || []).map((employee) => Number(employee.employee_id))
);

const applyBidFinancialRules = (data, existingBid = null) => {
     const hasDbWageRate = data.db_wage_rate !== undefined;
     const dbWageRateEnabled = hasDbWageRate
          ? data.db_wage_rate === 1
          : normalizeBooleanFlag(existingBid?.db_wage_rate ?? existingBid?.dbWageRate) === 1;

     if (!dbWageRateEnabled) {
          if (hasDbWageRate || !existingBid) {
               data.db_wage_rate = 0;
               data.tax_exempt = 0;
               data.fringes_amount = null;
          } else {
               delete data.tax_exempt;
               delete data.fringes_amount;
          }
     } else {
          if (hasDbWageRate) data.db_wage_rate = 1;
          if (data.tax_exempt !== undefined) {
               data.tax_exempt = data.tax_exempt === 1 ? 1 : 0;
          } else if (!existingBid) {
               data.tax_exempt = 0;
          }
          if (data.fringes_amount !== undefined) data.fringes_amount = normalizeAmount(data.fringes_amount);
     }

     if (data.base_contract_amount !== undefined) {
          data.base_contract_amount = normalizeAmount(data.base_contract_amount);
     }

     return data;
};

const normalizeBidBody = (body = {}) => {
     const data = {};

     if (body.project_name !== undefined) data.project_name = String(body.project_name).trim();

     if (body.address !== undefined) data.address = String(body.address).trim();

     if (body.due_date !== undefined) data.due_date = formatDate(body.due_date);

     const rawClientIds = body.client_id ?? body.client_ids ?? body.clients;
     if (rawClientIds !== undefined) data.client_ids = Array.from(new Set(normalizeClientIds(rawClientIds)));

     const rawClientEmployeeIds = body.client_employee_id ?? body.client_employee_ids ?? body.clientEmployeeIds ?? body.employees;
     if (rawClientEmployeeIds !== undefined) data.client_employee_ids = Array.from(new Set(normalizeClientEmployeeIds(rawClientEmployeeIds)));

     if (body.drawing_date !== undefined) data.drawing_date = formatDate(body.drawing_date);

     if (body.drawing_description !== undefined) {
          data.drawing_description = body.drawing_description ? String(body.drawing_description).trim() : null;
     }

     const scopeOfWork = body.scope_of_work ?? body.scopeOfWork;
     if (scopeOfWork !== undefined) data.scope_of_work = normalizePlanText(scopeOfWork);

     const exclusion = body.exclusion ?? body.exclusions;
     if (exclusion !== undefined) data.exclusion = normalizePlanText(exclusion);

     const accessNotes = body.access_notes ?? body.accessNotes;
     if (accessNotes !== undefined) data.access_notes = normalizePlanText(accessNotes);

     const dbWageRate = body.db_wage_rate ?? body.dbWageRate;
     if (dbWageRate !== undefined) data.db_wage_rate = normalizeBooleanFlag(dbWageRate);

     const taxExempt = body.tax_exempt ?? body.taxExempt;
     if (taxExempt !== undefined) data.tax_exempt = normalizeBooleanFlag(taxExempt);

     if (body.fringes_amount !== undefined) data.fringes_amount = body.fringes_amount;

     if (body.base_contract_amount !== undefined) data.base_contract_amount = body.base_contract_amount;
     else if (body.base_amount !== undefined) data.base_contract_amount = body.base_amount;
     else if (body.baseAmount !== undefined) data.base_contract_amount = body.baseAmount;

     if (body.grand_total !== undefined) data.grand_total = normalizeAmount(body.grand_total);
     else if (body.bid_value !== undefined) data.grand_total = normalizeAmount(body.bid_value);

     if (body.award_number !== undefined) data.award_number = normalizeAmount(body.award_number);

     if (body.base_contract_amount !== undefined) data.base_contract_amount = normalizeAmount(body.base_contract_amount);
     else if (body.baseContractAmount !== undefined) data.base_contract_amount = normalizeAmount(body.baseContractAmount);

     if (body.vendor_employee_ids !== undefined) {
          const vendorEmployeeSelections = normalizeVendorEmployeeSelections(body.vendor_employee_ids);
          data.vendor_employee_ids = vendorEmployeeSelections && vendorEmployeeSelections.length > 0
               ? vendorEmployeeSelections
               : normalizeClientEmployeeIds(body.vendor_employee_ids);
     }

     if (body.overhead !== undefined) data.overhead = normalizeAmount(body.overhead);

     if (body.profit !== undefined) data.profit = normalizeAmount(body.profit);

     if (body.last_follow_up_date !== undefined) data.last_follow_up_date = formatDateTime(body.last_follow_up_date);

     if (body.approved_by !== undefined) {
          data.approved_by = body.approved_by ? String(body.approved_by).trim() : null;
     }

     if (body.status !== undefined) {
          const normalized = String(body.status).trim().toLowerCase();
          if (normalized === 'bidinprogress' || normalized === 'bid in progress') {
               data.status = 'bidInProgress';
          } else if (normalized === 'senttoclient' || normalized === 'sent to client' || normalized === 'shared with client' || normalized === 'client to respond') {
               data.status = 'sentToClient';
          } else {
               data.status = normalized;
          }
     }

     if (body.created_by !== undefined) data.created_by = Number(body.created_by);

     return data;
};

const validateBidData = (data, requireAll = false, existingBid = null) => {
     if (requireAll) {
          if (!data.project_name) return 'Project name is required.';
          if (!data.address) return 'Address is required.';
          if (!data.due_date) return 'Due Date is required.';
          if (!data.drawing_date) return 'Drawing Date is required.';

          const today = new Date();
          const year = today.getFullYear();
          const month = String(today.getMonth() + 1).padStart(2, '0');
          const day = String(today.getDate()).padStart(2, '0');
          const todayStr = `${year}-${month}-${day}`;

          if (data.drawing_date < todayStr) {
               return 'Drawing Date must be today or a future date.';
          }

          if (!data.client_ids || !data.client_ids.length) return 'At least one client is required.';
          if (!data.client_employee_ids || !data.client_employee_ids.length) return 'At least one client employee is required.';
     } else {
          if (data.project_name !== undefined && !data.project_name) return 'Project name is required.';
          if (data.address !== undefined && !data.address) return 'Address is required.';
          if (data.due_date !== undefined && !data.due_date) return 'Due Date is required.';
          if (data.drawing_date !== undefined && !data.drawing_date) return 'Drawing Date is required.';
     }

     if (data.base_contract_amount !== undefined && !hasValidNonNegativeAmount(data.base_contract_amount)) {
          return 'Base Contract Amount must be a valid non-negative number.';
     }

     const dbWageRateEnabled = data.db_wage_rate === 1;

     if (dbWageRateEnabled) {
          if (data.fringes_amount !== undefined && !hasValidNonNegativeAmount(data.fringes_amount)) return 'Fringes Amount is required.';
          if (requireAll) {
               if (data.fringes_amount === undefined) return 'Fringes Amount is required.';
               if (data.base_contract_amount === undefined) return 'Base Contract Amount is required.';
          }
     }

     const statusVal = data.status || (existingBid ? (existingBid.status || existingBid.bid_status) : null);
     const isWonStatus = String(statusVal || '').toLowerCase() === 'won';
     if (isWonStatus) {
          const awardNum = data.award_number !== undefined ? data.award_number : (existingBid ? existingBid.award_number : undefined);
          if (awardNum === undefined || awardNum === null || awardNum === '') {
               return 'Award Number is required when project status is won.';
          }
          const amount = Number(awardNum);
          if (!Number.isFinite(amount) || amount < 0 || amount > 9999999999.99) {
               return 'Award Number must be a valid non-negative number within decimal(12,2) range.';
          }
     } else if (data.award_number !== undefined && data.award_number !== null && data.award_number !== '') {
          const amount = Number(data.award_number);
          if (!Number.isFinite(amount) || amount < 0 || amount > 9999999999.99) {
               return 'Award Number must be a valid non-negative number within decimal(12,2) range.';
          }
     }

     return null;
};

const getBids = async (req, res) => {
     try {
          const search = (req.query.search || '').trim();
          let status = (req.query.status || '').trim();
          const tab = (req.query.tab || '').trim().toLowerCase();
          const client_id = (req.query.client_id || '');
          const client_ids = (req.query.client_ids || '');
          const pipeline = (req.query.pipeline || '').trim().toLowerCase();
          const projectScope = (req.query.project_scope || '').trim().toLowerCase();

          // logger.info('getBids called', {
          //      search,
          //      status,
          //      tab,
          //      client_id,
          //      client_ids,
          //      pipeline,
          //      projectScope,
          //      is_pinned: req.query.is_pinned !== undefined ? req.query.is_pinned : req.query.isPinned
          // });

          if (!status && tab && tab !== 'all bids' && tab !== 'all' && tab !== 'overdue') { status = tab; }
          if (projectScope === 'won') { status = 'won'; }

          const requestedPage = parseInt(req.query.page, 10);
          const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
          const requestedLimit = parseInt(req.query.limit, 10);
          const limit = Number.isInteger(requestedLimit) && requestedLimit > 0
               ? Math.min(requestedLimit, 1000)
               : PAGE_SIZE;
          const isPinned = req.query.is_pinned !== undefined ? req.query.is_pinned : req.query.isPinned;
          const startDate = (req.query.start_date || '').trim();
          const endDate = (req.query.end_date || '').trim();

          const { bids, totalRecords, statusCounts } = await Bid.getBids({
               search,
               status,
               clientId: client_id,
               client_ids,
               page,
               limit,
               pipeline,
               isPinned,
               projectScope,
               startDate,
               endDate
          });

          const totalPages = Math.ceil(totalRecords / limit);

          // logger.info('Projects fetched successfully');
          return sendSuccess(res, 'Projects fetched successfully', {
               bids,
               statusCounts,
               filters: { search, status, client_id, client_ids, projectScope }
          }, {
               pagination: {
                    currentPage: page,
                    perPage: limit,
                    totalPages,
                    totalRecords
               }
          });
     } catch (err) {
          logger.error(`Error fetching bid details: ${err.message}`);
          return sendError(res, 500, 'Error fetching bid details');
     }
};

const viewBid = async (req, res) => {
     try {
          const bidId = getBidId(req);
          if (!bidId) { return sendValidationError(res, 'Valid bid id is required.'); }

          const bid = await Bid.getBidById(bidId);
          if (!bid) { return sendError(res, 404, 'Bid not found.'); }

          // logger.info(`Bid fetched successfully: ${bidId}`);
          return sendSuccess(res, 'Bid fetched successfully', { bid });
     } catch (err) {
          logger.error(`Error fetching bid: ${err.message}`);
          return sendError(res, 500, 'Error fetching bid');
     }
};

const createBid = async (req, res) => {
     try {
          const bidData = normalizeBidBody(req.body);
          applyBidFinancialRules(bidData);

          bidData.status = bidData.status || 'bidInProgress';
          bidData.created_by = req.user.id;

          const validationError = validateBidData(bidData, true);
          if (validationError) { return sendValidationError(res, validationError); }

          const existingBid = await Bid.getBidByProjectName(bidData.project_name);
          if (existingBid) { return sendError(res, 409, 'Bid with this project name already exists.'); }

          const clientEmployeeIds = normalizeClientEmployeeIds(bidData.client_employee_ids);
          if (clientEmployeeIds.length === 0) {
               return sendValidationError(res, 'At least one valid client employee is required.');
          }

          const clientIds = normalizeClientIds(bidData.client_ids);
          const bidClients = await Bid.getBidClients(clientIds);
          if (clientIds.length > 0 && (!Array.isArray(bidClients) || bidClients.length !== clientIds.length)) {
               return sendValidationError(res, 'Please choose valid client ids.');
          }

          const bidClientEmployees = await Bid.getBidClientEmployees(clientEmployeeIds);
          if (!Array.isArray(bidClientEmployees) || bidClientEmployees.length !== clientEmployeeIds.length) {
               return sendValidationError(res, 'Please choose valid client employee ids.');
          }

          const clientIdSet = new Set(clientIds);
          const hasMismatchedEmployeeClient = bidClientEmployees.some((employee) => !clientIdSet.has(Number(employee.client_id)));
          if (hasMismatchedEmployeeClient) {
               return sendValidationError(res, 'Client employees must belong to the selected clients.');
          }

          if (bidData.status && !VALID_STATUS.includes(bidData.status)) { return sendValidationError(res, 'Invalid bid status.'); }

          const bidId = await Bid.createBid({
               ...bidData,
               created_by: req.user.id
          });

          const createdBid = await Bid.getBidById(bidId);

          logger.info(`Bid created successfully: ${createdBid.project_name}`);
          return sendCreated(res, 'Bid created successfully', createdBid);
     } catch (err) {
          logger.error(`Error creating bid: ${err.message}`);
          return sendError(res, 500, 'Error creating bid');
     }
};

const updateBid = async (req, res) => {
     try {
          const bidId = getBidId(req);
          if (!bidId) { return sendValidationError(res, 'Valid bid id is required.'); }

          const bid = await Bid.getBidById(bidId);
          if (!bid) { return sendError(res, 404, 'Bid not found.'); }
          if (bid.project_status === 'completed') { return sendError(res, 400, 'Project is completed and cannot be modified.'); }

          const bidData = normalizeBidBody(req.body);

          // Enforce forward-only bid_status transitions
          if (bidData.status !== undefined) {
               const currentStatus = String(bid.status || bid.bid_status || 'bidInProgress');
               const transitionError = validateBidStatusTransition(currentStatus, bidData.status);
               if (transitionError) {
                    return sendValidationError(res, transitionError);
               }
          }
          applyBidFinancialRules(bidData, bid);
          delete bidData.id;
          delete bidData.bid_id;

          if (Object.keys(bidData).length === 0) { return sendValidationError(res, 'At least one bid field is required to update.'); }

          const validationError = validateBidData(bidData, false, bid);
          if (validationError) { return sendValidationError(res, validationError); }

          if (bidData.project_name && bidData.project_name !== bid.project_name) {
               const duplicateBid = await Bid.getBidByProjectNameExceptId(bidData.project_name, bidId);
               if (duplicateBid) { return sendError(res, 409, 'Bid with this project name already exists.'); }
          }

          if (bidData.status !== undefined && !VALID_STATUS.includes(bidData.status)) { return sendValidationError(res, 'Invalid bid status.'); }

          const nextClientIds = bidData.client_ids !== undefined ? normalizeClientIds(bidData.client_ids) : getCurrentBidClientIds(bid);

          if (bidData.client_ids !== undefined) {
               if (nextClientIds.length === 0) {
                    return sendValidationError(res, 'At least one valid client is required.');
               }

               const bidClients = await Bid.getBidClients(nextClientIds);
               if (!Array.isArray(bidClients) || bidClients.length !== nextClientIds.length) {
                    return sendValidationError(res, 'Please choose valid client ids.');
               }
          }

          if (bidData.client_employee_ids !== undefined || bidData.client_ids !== undefined) {
               const nextEmployeeIds = bidData.client_employee_ids !== undefined
                    ? normalizeClientEmployeeIds(bidData.client_employee_ids)
                    : getCurrentBidEmployeeIds(bid);

               if (nextEmployeeIds.length === 0) { return sendValidationError(res, 'At least one valid client employee is required.'); }

               const bidClientEmployees = await Bid.getBidClientEmployees(nextEmployeeIds);
               if (!Array.isArray(bidClientEmployees) || bidClientEmployees.length !== nextEmployeeIds.length) {
                    return sendValidationError(res, 'Please choose valid client employee ids.');
               }

               const clientIdSet = new Set(nextClientIds);
               const hasMismatchedEmployeeClient = bidClientEmployees.some((employee) => !clientIdSet.has(Number(employee.client_id)));
               if (hasMismatchedEmployeeClient) { return sendValidationError(res, 'Client employees must belong to the selected clients.'); }
          }

          if (bidData.vendor_employee_ids !== undefined) {
               const vendorEmployeeIds = normalizeVendorEmployeeSelections(bidData.vendor_employee_ids) || [];
               const employeeIds = vendorEmployeeIds.map((employee) => employee.client_employee_id);

               if (employeeIds.length > 0) {
                    const bidEmployees = await Bid.getBidEmployees(employeeIds);
                    if (!Array.isArray(bidEmployees) || bidEmployees.length !== employeeIds.length) {
                         return sendValidationError(res, 'Please choose valid employee ids.');
                    }
               }
          }

          await Bid.updateBid(bidId, bidData);
          const updatedBid = await Bid.getBidById(bidId);

          logger.info(`Bid updated successfully: ${bidId}`);
          return sendSuccess(res, 'Bid updated successfully', { bid: updatedBid });
     } catch (err) {
          logger.error(`Error updating bid: ${err.message}`);
          return sendError(res, 500, 'Error updating bid');
     }
};

const deleteBid = async (req, res) => {
     try {
          const bidId = getBidId(req);
          if (!bidId) { return sendValidationError(res, 'Valid bid id is required.'); }

          const bid = await Bid.getBidById(bidId);
          if (!bid) { return sendError(res, 404, 'Bid not found.'); }
          if (bid.project_status === 'completed') { return sendError(res, 400, 'Project is completed and cannot be modified.'); }

          if (bid.status === 'deleted') { return sendError(res, 400, 'Bid is already deleted.'); }

          await Bid.deleteBid(bidId);

          logger.info(`Bid deleted successfully: ${bidId}`);
          return sendSuccess(res, 'Bid deleted successfully');
     } catch (err) {
          logger.error(`Error deleting bid: ${err.message}`);
          return sendError(res, 500, 'Error deleting bid');
     }
};


const pinBid = async (req, res) => {
     try {
          const bidId = getBidId(req);
          if (!bidId) { return sendValidationError(res, 'Valid bid id is required.'); }

          const bid = await Bid.getBidById(bidId);
          if (!bid) { return sendError(res, 404, 'Bid not found.'); }
          if (bid.project_status === 'completed') { return sendError(res, 400, 'Project is completed and cannot be modified.'); }

          const success = await Bid.pinBid(bidId);
          if (!success) { return sendError(res, 404, 'Bid not found or already pinned.'); }

          logger.info(`Bid pinned successfully: ${bidId}`);
          return sendSuccess(res, 'Bid pinned successfully');
     } catch (err) {
          logger.error(`Error pinning bid: ${err.message}`);
          return sendError(res, 500, 'Error pinning bid');
     }
};

const unpinBid = async (req, res) => {
     try {
          const bidId = getBidId(req);
          if (!bidId) { return sendValidationError(res, 'Valid bid id is required.'); }

          const bid = await Bid.getBidById(bidId);
          if (!bid) { return sendError(res, 404, 'Bid not found.'); }
          if (bid.project_status === 'completed') { return sendError(res, 400, 'Project is completed and cannot be modified.'); }

          const success = await Bid.unpinBid(bidId);
          if (!success) { return sendError(res, 404, 'Bid not found or already unpinned.'); }

          logger.info(`Bid unpinned successfully: ${bidId}`);
          return sendSuccess(res, 'Bid unpinned successfully');
     } catch (err) {
          logger.error(`Error unpinning bid: ${err.message}`);
          return sendError(res, 500, 'Error unpinning bid');
     }
};

const archiveBid = async (req, res) => {
     try {
          const bidId = getBidId(req);
          if (!bidId) { return sendValidationError(res, 'Valid bid id is required.'); }

          const bid = await Bid.getBidById(bidId);
          if (!bid) { return sendError(res, 404, 'Bid not found.'); }
          if (bid.project_status === 'completed') { return sendError(res, 400, 'Project is completed and cannot be modified.'); }

          if (bid.project_status === 'archived') { return sendError(res, 400, 'Bid is already archived.'); }

          await Bid.archiveBid(bidId);

          logger.info(`Bid archived successfully: ${bidId}`);
          return sendSuccess(res, 'Bid archived successfully');
     } catch (err) {
          logger.error(`Error archiving bid: ${err.message}`);
          return sendError(res, 500, 'Error archiving bid');
     }
};

const unarchiveBid = async (req, res) => {
     try {
          const bidId = getBidId(req);
          if (!bidId) { return sendValidationError(res, 'Valid bid id is required.'); }

          const bid = await Bid.getBidById(bidId);
          if (!bid) { return sendError(res, 404, 'Bid not found.'); }
          if (bid.project_status === 'completed') { return sendError(res, 400, 'Project is completed and cannot be modified.'); }

          if (bid.project_status !== 'archived') { return sendError(res, 400, 'Bid is not archived.'); }

          await Bid.unarchiveBid(bidId);

          logger.info(`Bid unarchived successfully: ${bidId}`);
          return sendSuccess(res, 'Bid unarchived successfully');
     } catch (err) {
          logger.error(`Error unarchiving bid: ${err.message}`);
          return sendError(res, 500, 'Error unarchiving bid');
     }
};

const getDueSoon = async (req, res) => {
     try {
          const requestedPage = parseInt(req.query.page, 10);
          const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
          const requestedLimit = parseInt(req.query.limit, 10);
          const limit = Number.isInteger(requestedLimit) && requestedLimit > 0
               ? Math.min(requestedLimit, 100)
               : 10;

          const { bids, totalRecords } = await Bid.getDueSoonBids({ page, limit });

          const totalPages = Math.ceil(totalRecords / limit);

          // Add pipeline tag to each bid
          const bidsWithTags = bids.map(bid => {
               const status = String(bid.status || '').trim().toLowerCase();
               let tag = 'Calendar'; // default fallback
               if (status === 'won' || status === 'approved') {
                    tag = 'Projects';
               } else if (['bidinprogress', 'bid in progress', 'pending', 'pendingapproval'].includes(status)) {
                    tag = 'Sales';
               } else if (['senttoclient', 'sent to client', 'shared with client', 'client to respond', 'lost', 'declined', 'notbidding'].includes(status)) {
                    tag = 'CRM';
               }
               return {
                    ...bid,
                    tag
               };
          });

          return sendSuccess(res, 'Due soon projects fetched successfully', {
               bids: bidsWithTags
          }, {
               pagination: {
                    currentPage: page,
                    perPage: limit,
                    totalPages,
                    totalRecords
               }
          });
     } catch (err) {
          logger.error(`Error fetching due soon projects: ${err.message}`);
          return sendError(res, 500, 'Error fetching due soon projects');
     }
};

module.exports = {
     getBids,
     viewBid,
     createBid,
     updateBid,
     deleteBid,
     archiveBid,
     unarchiveBid,
     pinBid,
     unpinBid,
     getDueSoon
};