const logger = require('../../common/utils/logger');
const EmployeeModel = require('../models/employeeModel');
const { ensureClientExists, clientBlockedPageResponse, clientBlockedEmptyDataResponse } = require('./helpers/companyGuards');
const { buildPagination } = require('../../common/utils/pagination');
const { sendSuccess, sendCreated, sendError, sendValidationError } = require('../../common/utils/apiResponse');

const isTruthyAdminValue = (value) => value === true || value === 1 || value === '1' || value === 'true';

const getEmployeesByCompany = async (req, res, next) => {
     try {
          const { clientId } = req.params;
          const page = req.query.page || 1;
          const limit = req.query.limit || 3;
          const search = (req.query.search || req.query.query || req.query.name || req.query.q || '').trim();

          if (!clientId) { return sendError(res, 400, 'Client ID is required'); }

          const { error, client } = await ensureClientExists(clientId);
          if (error) { return sendError(res, error.statusCode, error.message); }

          if (client.is_blocked) { return clientBlockedPageResponse(res, page, limit); }

          const result = await EmployeeModel.getEmployeesByCompany(clientId, page, limit, search);
          return sendSuccess(res, 'Employees retrieved successfully', result, {
               pagination: buildPagination(result)
          });
     } catch (err) {
          logger.error(`Error fetching employees: ${err.message}`);
          return sendError(res, 500, 'Error fetching employees');
     }
};

const getEmployeeById = async (req, res, next) => {
     try {
          const { employeeId } = req.params;

          if (!employeeId) { return sendValidationError(res, 'Employee ID is required'); }

          const employee = await EmployeeModel.getEmployeeById(employeeId);

          if (!employee) { return sendError(res, 404, 'Employee not found'); }

          return sendSuccess(res, 'Employee retrieved successfully', { employee });
     } catch (err) {
          logger.error(`Error fetching employee: ${err.message}`);
          return sendError(res, 500, 'Error fetching employee');
     }
};

const createEmployee = async (req, res, next) => {
     try {
          const { clientId } = req.params;
          const { first_name, last_name, phone, email, designation, is_admin } = req.body;

          if (!clientId) { return sendValidationError(res, 'Client ID is required'); }

          if (!first_name) { return sendValidationError(res, 'First name is required'); }

          if (email) {
               const existingEmployee = await EmployeeModel.getEmployeeByEmail(clientId, email);
               if (existingEmployee) { return sendError(res, 409, 'Employee with this email already exists in this company'); }
          }

          if (phone) {
               const existingEmployee = await EmployeeModel.getEmployeeByPhone(clientId, phone);
               if (existingEmployee) { return sendError(res, 409, 'Employee with this phone already exists in this company'); }
          }

          const { error, client } = await ensureClientExists(clientId);
          if (error) { return sendError(res, error.statusCode, error.message); }

          if (client.is_blocked) { return sendError(res, 400, 'Cannot create employee for blocked client'); }

          if (isTruthyAdminValue(is_admin)) {
               const existingAdmin = await EmployeeModel.getActiveAdminForCompany(clientId);
               if (existingAdmin) {
                    return sendError(res, 409, 'This company already has a contact person');
               }
          }

          const employeeId = await EmployeeModel.createEmployee(clientId, req.body, req.user?.id);
          const employee = await EmployeeModel.getEmployeeById(employeeId);

          // Send welcome email asynchronously
          if (employee && employee.email) {
               const { sendWelcomeEmail } = require('../services/auth/welcomeMailer');
               const roleType = client?.company_type === 'vendor' ? 'vendor' : 'employee';
               sendWelcomeEmail({
                    email: employee.email,
                    name: `${employee.first_name} ${employee.last_name || ''}`.trim(),
                    roleType: roleType
               }).catch(err => logger.error('Error sending welcome email from employeeController', { error: err.message }));
          }

          logger.info(`New employee created with ID: ${employeeId} for company ${clientId}`);
          return sendCreated(res, 'Employee created successfully', { employee });
     } catch (err) {
          logger.error(`Error creating employee: ${err.message}`);
          return sendError(res, 500, 'Error creating employee');
     }
};

const updateEmployee = async (req, res, next) => {
     try {
          const { employeeId } = req.params;
          if (!employeeId) { return sendValidationError(res, 'Employee ID is required'); }

          // Check if employee exists
          const employee = await EmployeeModel.getEmployeeById(employeeId);
          if (!employee) { return sendError(res, 404, 'Employee not found'); }

          if (req.body.email && req.body.email !== employee.email) {
               const duplicateByEmail = await EmployeeModel.getEmployeeByEmail(employee.client_id, req.body.email);
               if (duplicateByEmail && Number(duplicateByEmail.id) !== Number(employeeId)) {
                    return sendError(res, 409, 'Employee with this email already exists in this company');
               }
          }

          if (req.body.phone && req.body.phone !== employee.phone) {
               const duplicateByPhone = await EmployeeModel.getEmployeeByPhone(employee.client_id, req.body.phone);
               if (duplicateByPhone && Number(duplicateByPhone.id) !== Number(employeeId)) {
                    return sendError(res, 409, 'Employee with this phone already exists in this company');
               }
          }

          if (isTruthyAdminValue(req.body.is_admin)) {
               const existingAdmin = await EmployeeModel.getActiveAdminForCompany(employee.client_id, employeeId);
               if (existingAdmin) {
                    return sendError(res, 409, 'This company already has a contact person');
               }
          }

          await EmployeeModel.updateEmployee(employeeId, req.body);
          const updatedEmployee = await EmployeeModel.getEmployeeById(employeeId);
          if (updatedEmployee) {
               logger.info(`Employee ${employeeId} updated successfully`);
               return sendSuccess(res, 'Employee updated successfully', { employee: updatedEmployee });
          }
     } catch (err) {
          logger.error(`Error updating employee: ${err.message}`);
          return sendError(res, 500, 'Error updating employee');
     }
};

const deleteEmployee = async (req, res, next) => {
     try {
          const { employeeId } = req.params;

          if (!employeeId) { return sendValidationError(res, 'Employee ID is required'); }

          // Check if employee exists
          const employee = await EmployeeModel.getEmployeeById(employeeId);
          if (!employee) { return sendError(res, 404, 'Employee not found'); }

          const deleted = await EmployeeModel.deleteEmployee(employeeId);
          if (!deleted) { return sendError(res, 400, 'Failed to delete employee'); }
          logger.info(`Employee ${employeeId} deleted successfully`);
          return sendSuccess(res, 'Employee deleted successfully');
     } catch (err) {
          logger.error(`Error deleting employee: ${err.message}`);
          return sendError(res, 500, 'Error deleting employee');
     }
};

const searchEmployees = async (req, res, next) => {
     try {
          const { clientId } = req.params;
          const query = (req.query.query || req.query.search || req.query.name || req.query.q || '').trim();

          if (!clientId) { return sendError(res, 400, 'Client ID is required'); }

          if (!query) { return sendError(res, 400, 'Search query is required'); }

          const { error, client } = await ensureClientExists(clientId);
          if (error) { return sendError(res, error.statusCode, error.message); }

          if (client.is_blocked) { return clientBlockedEmptyDataResponse(res); }

          const results = await EmployeeModel.searchEmployees(clientId, query);
          return sendSuccess(res, 'Search completed successfully', { results });
     } catch (err) {
          logger.error(`Error searching employees: ${err.message}`);
          return sendError(res, 500, 'Error searching employees');
     }
};

const getCompanyAdmins = async (req, res, next) => {
     try {
          const { clientId } = req.params;

          if (!clientId) { return sendError(res, 400, 'Client ID is required'); }

          const { error, client } = await ensureClientExists(clientId);
          if (error) { return sendError(res, error.statusCode, error.message); }

          if (client.is_blocked) { return clientBlockedEmptyDataResponse(res); }

          const admins = await EmployeeModel.getCompanyAdmins(clientId);
          return sendSuccess(res, 'Company admins retrieved successfully', { admins });
     } catch (err) {
          logger.error(`Error fetching company admins: ${err.message}`);
          return sendError(res, 500, 'Error fetching company admins');
     }
};

const getEmployeesByDesignation = async (req, res, next) => {
     try {
          const { clientId, designation } = req.params;

          if (!clientId) { return sendError(res, 400, 'Client ID is required'); }

          if (!designation) { return sendError(res, 400, 'Designation is required'); }

          const { error, client } = await ensureClientExists(clientId);
          if (error) { return sendError(res, error.statusCode, error.message); }

          if (client.is_blocked) { return clientBlockedEmptyDataResponse(res); }

          const employees = await EmployeeModel.getEmployeesByDesignation(clientId, designation);
          return sendSuccess(res, 'Employees retrieved successfully', { employees });
     } catch (err) {
          logger.error(`Error fetching employees by designation: ${err.message}`);
          return sendError(res, 500, 'Error fetching employees by designation');
     }
};

module.exports = {
     getEmployeesByCompany,
     getEmployeeById,
     createEmployee,
     updateEmployee,
     deleteEmployee,
     searchEmployees,
     getCompanyAdmins,
     getEmployeesByDesignation
};