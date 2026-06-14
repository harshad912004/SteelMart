const bcryptjs = require('bcryptjs');
const logger = require('../../common/utils/logger');
const SystemEmployee = require('../models/systemEmployeeModel');
const { sendSuccess, sendError, sendCreated, sendValidationError } = require('../../common/utils/apiResponse');
const { PASSWORD_REGEX, PASSWORD_POLICY_MESSAGE } = require('../../common/utils/passwordPolicy');

const PAGE_SIZE = 5;
const VALID_GENDERS = ['male', 'female', 'other'];

const getEmployeeId = (req) => {
     const body = req.body || {};
     const id = req.params.id || req.query.id || body.id || body.employee_id;
     const employeeId = Number(id);
     return Number.isInteger(employeeId) && employeeId > 0 ? employeeId : null;
};

const isSelfAction = (req, employeeId) => req.user && Number(req.user.id) === Number(employeeId);

const normalizeEmployeeBody = (body = {}) => {
     const data = {};

     if (body.first_name !== undefined) data.first_name = String(body.first_name).trim();
     if (body.last_name !== undefined) data.last_name = String(body.last_name).trim();
     if (body.email !== undefined) data.email = String(body.email).trim().toLowerCase();
     if (body.phone !== undefined) data.phone = body.phone ? String(body.phone).trim() : null;
     if (body.password !== undefined) data.password = body.password ? String(body.password) : null;
     if (body.date_of_birth !== undefined) data.date_of_birth = body.date_of_birth || null;
     if (body.gender !== undefined) data.gender = String(body.gender).trim().toLowerCase();
     if (body.address !== undefined) data.address = body.address ? String(body.address).trim() : null;
     if (body.role_id !== undefined) data.role = body.role_id;
     if (body.role !== undefined) data.role = body.role;

     return data;
};

const validateEmployeeData = (data, requireFields = false) => {
     if (requireFields && (!data.first_name || !data.last_name || !data.email || !data.role)) { return 'First name, last name, email, and role are required.'; }
     if (data.first_name !== undefined && !data.first_name) return 'First name is required.';
     if (data.last_name !== undefined && !data.last_name) return 'Last name is required.';
     if (data.email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) { return 'Please enter a valid email address.'; }
     if (data.password !== undefined && data.password !== null && !PASSWORD_REGEX.test(data.password)) { return PASSWORD_POLICY_MESSAGE; }
     if (data.gender !== undefined && !VALID_GENDERS.includes(data.gender)) { return 'Gender must be male, female, or other.'; }

     return null;
};

const getEmployees = async (req, res) => {
     try {
          const search = (req.query.search || '').trim();
          const role = (req.query.role || '').trim();
          let status = (req.query.status || '').trim();
          const tab = (req.query.tab || '').trim().toLowerCase();
          const companyType = (req.query.company_type || 'steelmart').trim().toLowerCase();

          if (!status && tab && tab !== 'all') { status = tab; }
          const requestedPage = parseInt(req.query.page, 10);
          const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

          const requestedLimit = parseInt(req.query.limit, 10);
          const limit = Number.isInteger(requestedLimit) && requestedLimit > 0 ? requestedLimit : PAGE_SIZE;

          const { employees, totalRecords, statusCounts } = await SystemEmployee.getEmployees({
               search,
               role,
               status,
               page,
               limit,
               companyType
          });

          const totalPages = Math.ceil(totalRecords / PAGE_SIZE);

          // logger.info('Employees fetched successfully');
          return sendSuccess(res, 'Employees fetched successfully', {
               employees,
               statusCounts,
               filters: { search, role, status },
               pagination: {
                    currentPage: page,
                    perPage: PAGE_SIZE,
                    totalPages,
                    totalRecords
               }
          });
     } catch (err) {
          logger.error(`Error fetching employee details: ${err.message}`);
          return sendError(res, 500, 'Error fetching employee details');
     }
};

const addEmployee = async (req, res) => {
     try {
          const employeeData = normalizeEmployeeBody(req.body);
          employeeData.gender = employeeData.gender || 'male';

          const validationError = validateEmployeeData(employeeData, true);
          if (validationError) { return sendValidationError(res, validationError); }

          const existingEmployee = await SystemEmployee.getUserByEmail(employeeData.email);
          if (existingEmployee) { return sendError(res, 409, 'Employee with this email already exists.'); }

          const employeeRole = await SystemEmployee.getRole(employeeData.role);
          if (!employeeRole) { return sendError(res, 400, 'Invalid employee role.'); }

          const passwordToHash = employeeData.password || employeeData.email;
          const hashedPassword = await bcryptjs.hash(passwordToHash.trim().toLowerCase(), 10);
          const employee = await SystemEmployee.createEmployee({
               first_name: employeeData.first_name,
               last_name: employeeData.last_name,
               email: employeeData.email,
               phone: employeeData.phone || null,
               password: hashedPassword,
               date_of_birth: employeeData.date_of_birth || null,
               address: employeeData.address || null,
               role: employeeRole.id,
               gender: employeeData.gender,
               created_by: req.user.id
          });

          // Send welcome email asynchronously
          const { sendWelcomeEmail } = require('../services/auth/welcomeMailer');
          sendWelcomeEmail({
               email: employeeData.email,
               name: `${employeeData.first_name} ${employeeData.last_name || ''}`.trim(),
               roleType: 'employee'
          }).catch(err => logger.error('Error sending system employee welcome email', { error: err.message }));

          logger.info(`Employee added successfully: ${employee.email}`);
          return sendCreated(res, 'Employee added successfully', { employee });
     } catch (err) {
          logger.error(`Error adding employee: ${err.message}`);
          return sendError(res, 500, 'Error adding employee');
     }
};

const viewEmployee = async (req, res) => {
     try {
          const employeeId = getEmployeeId(req);
          if (!employeeId) { return sendValidationError(res, 'Valid employee id is required.'); }

          const employee = await SystemEmployee.getEmployeeById(employeeId);
          if (!employee) { return sendError(res, 404, 'Employee not found.'); }

          // logger.info(`Employee profile fetched successfully: ${employeeId}`);
          return sendSuccess(res, 'Employee profile fetched successfully', { employee });
     } catch (err) {
          logger.error(`Error viewing employee profile: ${err.message}`);
          return sendError(res, 500, 'Error viewing employee profile');
     }
};

const updateEmployee = async (req, res) => {
     try {
          const employeeId = getEmployeeId(req);
          if (!employeeId) { return sendValidationError(res, 'Valid employee id is required.'); }

          const employee = await SystemEmployee.getEmployeeById(employeeId);
          if (!employee) { return sendError(res, 404, 'Employee not found.'); }

          const employeeData = normalizeEmployeeBody(req.body);
          delete employeeData.id;
          delete employeeData.employee_id;

          if (Object.keys(employeeData).length === 0) { return sendValidationError(res, 'At least one profile field is required to update.'); }

          const validationError = validateEmployeeData(employeeData);
          if (validationError) { return sendValidationError(res, validationError); }

          const updates = { ...employeeData };

          if (updates.email && updates.email !== employee.email) {
               const duplicateEmployee = await SystemEmployee.getUserByEmailExceptId(updates.email, employeeId);
               if (duplicateEmployee) { return sendError(res, 409, 'Employee with this email already exists.'); }
          }

          if (updates.role !== undefined) {
               if (isSelfAction(req, employeeId)) {
                    return sendError(res, 403, 'You cannot change your own role while logged in.');
               }

               const employeeRole = await SystemEmployee.getRole(updates.role);
               if (!employeeRole) { return sendError(res, 400, 'Invalid employee role.'); }
               updates.role = employeeRole.id;
          }

          if (updates.password !== undefined) { updates.password = updates.password ? await bcryptjs.hash(updates.password, 10) : null; }

          const updatedEmployee = await SystemEmployee.updateEmployee(employeeId, updates);

          logger.info(`Employee profile updated successfully: ${employeeId}`);
          return sendSuccess(res, 'Employee updated successfully', { employee: updatedEmployee });
     } catch (err) {
          logger.error(`Error updating employee profile: ${err.message}`);
          return sendError(res, 500, 'Error updating employee profile');
     }
};

const deleteEmployee = async (req, res) => {
     try {
          const employeeId = getEmployeeId(req);
          if (!employeeId) { return sendValidationError(res, 'Valid employee id is required.'); }

          const employee = await SystemEmployee.getEmployeeById(employeeId);
          if (!employee) { return sendError(res, 404, 'Employee not found.'); }

          if (isSelfAction(req, employeeId)) { return sendError(res, 400, 'You cannot delete your own account while logged in.'); }

          const deletedEmployee = await SystemEmployee.softDeleteEmployee(employeeId);
          if (!deletedEmployee) { return sendError(res, 400, 'Failed to delete employee'); }
          logger.info(`Employee soft deleted successfully: ${employeeId}`);
          return sendSuccess(res, 'Employee deleted successfully');
     } catch (err) {
          logger.error(`Error deleting employee: ${err.message}`);
          return sendError(res, 500, 'Error deleting employee');
     }
};

const undeleteEmployee = async (req, res) => {
     try {
          const employeeId = getEmployeeId(req);
          if (!employeeId) { return sendValidationError(res, 'Valid employee id is required.'); }

          const employee = await SystemEmployee.getDeletedEmployeeById(employeeId);
          if (!employee) { return sendError(res, 404, 'Deleted employee not found.'); }

          if (employee.is_deleted === 0) { return sendError(res, 400, 'Employee is not deleted.'); }

          const undeletedEmployee = await SystemEmployee.restoreDeletedEmployee(employeeId);
          if (!undeletedEmployee) { return sendError(res, 500, 'Error restoring employee'); }
          logger.info(`Employee restored successfully: ${employeeId}`);
          return sendSuccess(res, 'Employee restored successfully');
     } catch (err) {
          logger.error(`Error restoring employee: ${err.message}`);
          return sendError(res, 500, 'Error restoring employee');
     }
};

const activeEmployee = async (req, res) => {
     try {
          const employeeId = getEmployeeId(req);
          if (!employeeId) { return sendValidationError(res, 'Valid employee id is required.'); }

          const employee = await SystemEmployee.getEmployeeById(employeeId);
          if (!employee) { return sendError(res, 404, 'Employee not found.'); }

          const activedEmployee = await SystemEmployee.activateEmployee(employeeId);
          if (!activedEmployee) { return sendError(res, 500, 'Error marking employee as active'); }
          logger.info(`Employee marked as active successfully: ${employeeId}`);
          return sendSuccess(res, 'Employee marked as active successfully');
     } catch (err) {
          logger.error(`Error marking employee as active: ${err.message}`);
          return sendError(res, 500, 'Error marking employee as active');
     }
};

const inactiveEmployee = async (req, res) => {
     try {
          const employeeId = getEmployeeId(req);
          if (!employeeId) { return sendValidationError(res, 'Valid employee id is required.'); }

          const employee = await SystemEmployee.getEmployeeById(employeeId);
          if (!employee) { return sendError(res, 404, 'Employee not found.'); }

          if (isSelfAction(req, employeeId)) { return sendError(res, 400, 'You cannot mark your own account inactive while logged in.'); }

          const inactivedEmployee = await SystemEmployee.softInactiveEmployee(employeeId);
          if (!inactivedEmployee) { return sendError(res, 500, 'Error marking employee as inactive'); }
          logger.info(`Employee marked as inactive successfully: ${employeeId}`);
          return sendSuccess(res, 'Employee marked as inactive successfully');
     } catch (err) {
          logger.error(`Error marking employee as inactive: ${err.message}`);
          return sendError(res, 500, 'Error marking employee as inactive');
     }
};

const blockEmployee = async (req, res) => {
     try {
          const employeeId = getEmployeeId(req);
          if (!employeeId) { return sendValidationError(res, 'Valid employee id is required.'); }

          const employee = await SystemEmployee.getEmployeeById(employeeId);
          if (!employee) { return sendError(res, 404, 'Employee not found.'); }

          if (isSelfAction(req, employeeId)) { return sendError(res, 400, 'You cannot block your own account while logged in.'); }

          const blockedEmployee = await SystemEmployee.softBlockEmployee(employeeId);
          if (!blockedEmployee) { return sendError(res, 500, 'Error blocking employee'); }
          logger.info(`Employee soft blocked successfully: ${employeeId}`);
          return sendSuccess(res, 'Employee blocked successfully');
     } catch (err) {
          logger.error(`Error blocking employee: ${err.message}`);
          return sendError(res, 500, 'Error blocking employee');
     }
};

const unblockEmployee = async (req, res) => {
     try {
          const employeeId = getEmployeeId(req);
          if (!employeeId) { return sendValidationError(res, 'Valid employee id is required.'); }

          const employee = await SystemEmployee.getEmployeeById(employeeId);
          if (!employee) { return sendError(res, 404, 'Employee not found.'); }

          const unlockedEmployee = await SystemEmployee.unblockEmployee(employeeId);
          if (!unlockedEmployee) { return sendError(res, 500, 'Error unblocking employee'); }
          logger.info(`Employee unblocked successfully: ${employeeId}`);
          return sendSuccess(res, 'Employee unblocked successfully');
     } catch (err) {
          logger.error(`Error unblocking employee: ${err.message}`);
          return sendError(res, 500, 'Error unblocking employee');
     }
};

module.exports = {
     getEmployees,
     addEmployee,
     viewEmployee,
     updateEmployee,
     deleteEmployee,
     undeleteEmployee,
     activeEmployee,
     inactiveEmployee,
     blockEmployee,
     unblockEmployee
};