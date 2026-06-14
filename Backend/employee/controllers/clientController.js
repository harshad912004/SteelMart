const logger = require('../../common/utils/logger');
const ClientModel = require('../models/clientModel');
const { getRequestValue, resolveClientTypeId, normalizeContactEmployee, normalizeClientData } = require('./helpers/clientHelpers');
const { buildPagination } = require('../../common/utils/pagination');
const { sendSuccess, sendCreated, sendError, sendValidationError } = require('../../common/utils/apiResponse');

const getAllClients = async (req, res, next) => {
     try {
          const page = req.query.page || 1;
          const limit = req.query.limit || 10;
          const search = (req.query.search || '').trim();
          const type = (req.query.type || '').trim();
          const result = await ClientModel.getAllClients(page, limit, search, type);
          const pagination = buildPagination(result);
          // logger.info('Clients retrieved successfully');
          return sendSuccess(res, 'Clients retrieved successfully', result, { pagination });
     } catch (err) {
          logger.error(`Error fetching clients: ${err.message}`);
          return sendError(res, 500, `Error fetching clients`);
     }
};

const getClientById = async (req, res, next) => {
     try {
          const { id } = req.params;
          if (!id) { return sendValidationError(res, 'Client ID is required'); }

          const client = await ClientModel.getClientById(id);
          if (!client) { return sendError(res, 404, 'Client not found'); }

          return sendSuccess(res, 'Client retrieved successfully', { client });
     } catch (err) {
          logger.error(`Error fetching client: ${err.message}`);
          return sendError(res, 500, err.message || 'Error fetching client');
     }
};

const getClientsByType = async (req, res, next) => {
     try {
          const typeId = getRequestValue(req, ['typeId', 'client_type_id', 'clientTypeId', 'type']);
          const page = req.query?.page || 1;
          const limit = req.query?.limit || 10;

          if (!typeId) { return sendValidationError(res, 'Client type ID is required'); }

          const result = await ClientModel.getClientsByType(typeId, page, limit);
          const pagination = buildPagination(result);

          const typeName = result.clientType || 'Client type';
          return sendSuccess(res, `${typeName}s retrieved successfully`, result, { pagination });
     } catch (err) {
          logger.error(`Error fetching clients by type: ${err.message}`);
          return sendError(res, 500, `Error fetching clients by type`);
     }
};

const createClient = async (req, res, next) => {
     try {
          const { company_name } = req.body;
          const userId = req.user?.id;

          // Validation
          if (!company_name) { return sendValidationError(res, 'Company name is required'); }

          const clientTypeId = await resolveClientTypeId(req.body);
          const employee = normalizeContactEmployee(req.body);

          const clientData = {
               ...normalizeClientData(req.body),
               ...req.body,
               client_type_id: clientTypeId
          };

          if (employee && !employee.first_name) { return sendValidationError(res, 'Employee first name is required'); }

          const result = employee
               ? await ClientModel.createClientWithEmployee(clientData, userId, employee)
               : { clientId: await ClientModel.createClient(clientData, userId), employeeId: null };

          logger.info(`New client created with ID: ${result.clientId} `);

          return sendCreated(res, 'Client created successfully', {
               id: result.clientId,
               clientId: result.clientId,
               employeeId: result.employeeId
          });
     } catch (err) {
          logger.error(`Error creating client: ${err.message} `);
          return sendError(res, 500, 'Error creating client');
     }
};

const createClientWithEmployee = createClient;

const updateClient = async (req, res, next) => {
     try {
          const { id } = req.params;
          const userId = req.user?.id;

          if (!id) { return sendValidationError(res, 'Client ID is required'); }

          // Check if client exists
          const client = await ClientModel.getClientById(id);
          if (!client) { return sendError(res, 404, 'Client not found'); }

          if (
               req.body.client_type_id !== undefined ||
               req.body.client_type !== undefined ||
               req.body.type_name !== undefined ||
               req.body.type !== undefined ||
               req.body.company_id !== undefined ||
               req.body.company_type !== undefined
          ) {
               req.body.client_type_id = await resolveClientTypeId(req.body);
          }

          const normalizedData = normalizeClientData(req.body);
          const updateData = { ...normalizedData, ...req.body };

          const updated = await ClientModel.updateClient(id, updateData, userId);
          if (!updated) { return sendError(res, 400, 'Failed to update client'); }

          logger.info(`Client ${id} updated successfully`);
          return sendSuccess(res, 'Client updated successfully');
     } catch (err) {
          logger.error(`Error updating client: ${err.message}`);
          return sendError(res, 500, 'Error updating client');
     }
};

const deleteClient = async (req, res, next) => {
     try {
          const { id } = req.params;
          if (!id) { return sendValidationError(res, 'Client ID is required'); }

          // Check if client exists
          const client = await ClientModel.getClientById(id);
          if (!client) { return sendError(res, 404, 'Client not found'); }

          const deleted = await ClientModel.deleteClient(id);
          if (!deleted) { return sendError(res, 400, 'Failed to delete client'); }

          logger.info(`Client ${id} deleted successfully`);
          return sendSuccess(res, 'Client deleted successfully');
     } catch (err) {
          logger.error(`Error deleting client: ${err.message}`);
          return sendError(res, 500, 'Error deleting client');
     }
};

const unDeleteClient = async (req, res, next) => {
     try {
          const { id } = req.params;
          if (!id) { return sendValidationError(res, 'Client ID is required'); }

          // Check if client exists
          const client = await ClientModel.getClientById(id);
          if (!client) { return sendError(res, 404, 'Client not found'); }

          const unDeleted = await ClientModel.unDeleteClient(id);
          if (!unDeleted) { return sendError(res, 400, 'Failed to restore client'); }
          logger.info(`Client ${id} restore successfully`);
          return sendSuccess(res, 'Client restore successfully');
     } catch (err) {
          logger.error(`Error restoring client: ${err.message}`);
          return sendError(res, 500, 'Error restoring client');
     }
};

const getClientTypes = async (req, res, next) => {
     try {
          const types = await ClientModel.getClientTypes();
          return sendSuccess(res, 'Client types retrieved successfully', { types });
     } catch (err) {
          logger.error(`Error fetching client types: ${err.message}`);
          return sendError(res, 500, 'Error fetching client types');
     }
};

const getEmployeeTags = async (req, res, next) => {
     try {
          const tags = await ClientModel.getEmployeeTags();
          return sendSuccess(res, 'Employee tags retrieved successfully', { tags });
     } catch (err) {
          logger.error(`Error fetching employee tags: ${err.message}`);
          return sendError(res, 500, 'Error fetching employee tags');
     }
};

const searchClients = async (req, res, next) => {
     try {
          const { query } = req.query;
          if (!query) { return sendValidationError(res, 'Search query is required'); }

          const results = await ClientModel.searchClients(query);
          return sendSuccess(res, 'Search completed successfully', { results });
     } catch (err) {
          logger.error(`Error searching clients: ${err.message}`);
          return sendError(res, 500, 'Error searching clients');
     }
};

const blockClient = async (req, res, next) => {
     try {
          const { id } = req.params;
          if (!id) { return sendValidationError(res, 'Client ID is required'); }

          const client = await ClientModel.getClientById(id);
          if (!client) { return sendError(res, 404, 'Client not found'); }

          const blocked = await ClientModel.blockClient(id);
          if (!blocked) { return sendError(res, 400, 'Failed to block client'); }

          logger.info(`Client ${id} blocked successfully`);
          const updatedClient = await ClientModel.getClientById(id);
          return sendSuccess(res, 'Client blocked successfully', { client: updatedClient });
     } catch (err) {
          logger.error(`Error blocking client: ${err.message}`);
          return sendError(res, 500, 'Error blocking client');
     }
};

const unblockClient = async (req, res, next) => {
     try {
          const { id } = req.params;
          if (!id) { return sendValidationError(res, 'Client ID is required'); }

          const client = await ClientModel.getClientById(id);
          if (!client) { return sendError(res, 404, 'Client not found'); }

          const unblocked = await ClientModel.unblockClient(id);
          if (!unblocked) { return sendError(res, 400, 'Failed to unblock client'); }

          logger.info(`Client ${id} unblocked successfully`);
          const updatedClient = await ClientModel.getClientById(id);
          return sendSuccess(res, 'Client unblocked successfully', { client: updatedClient });
     } catch (err) {
          logger.error(`Error unblocking client: ${err.message}`);
          return sendError(res, 500, 'Error unblocking client');
     }
};

module.exports = {
     getAllClients,
     getClientById,
     getClientsByType,
     createClient,
     createClientWithEmployee,
     updateClient,
     deleteClient,
     unDeleteClient,
     getClientTypes,
     getEmployeeTags,
     searchClients,
     blockClient,
     unblockClient
};