const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const employeeController = require('../controllers/employeeController');
const { isAuthenticated } = require('../middlewares/authMiddleware');
const {
  validateRequest,
  validateIdParam,
  validateClientCreate,
  validateClientUpdate,
  validateEmployeeCreate,
  validateEmployeeUpdate
} = require('../../common/utils/formValidators');

router.use(isAuthenticated);

router.get('/', clientController.getAllClients);
router.get('/all', clientController.getAllClients);
router.get('/getCompanies', clientController.getAllClients);
router.get('/types', clientController.getClientTypes);
router.get('/tags', clientController.getEmployeeTags);
router.get('/search', clientController.searchClients);
router.get('/type', clientController.getClientsByType);
router.get('/type/:typeId', clientController.getClientsByType);
router.post('/create', validateClientCreate, validateRequest, clientController.createClient);
router.post('/create-with-employee', validateClientCreate, validateRequest, clientController.createClientWithEmployee);

router.get('/:clientId/employees/all', validateIdParam('clientId', 'Client ID'), validateRequest, employeeController.getEmployeesByCompany);
router.get('/:clientId/employees/admins', validateIdParam('clientId', 'Client ID'), validateRequest, employeeController.getCompanyAdmins);
router.get('/:clientId/employees/designation/:designation', validateIdParam('clientId', 'Client ID'), validateRequest, employeeController.getEmployeesByDesignation);
router.get('/:clientId/employees/search', validateIdParam('clientId', 'Client ID'), validateRequest, employeeController.searchEmployees);
router.post('/:clientId/employees/create', validateIdParam('clientId', 'Client ID'), validateEmployeeCreate, validateRequest, employeeController.createEmployee);
router.get('/employee/:employeeId', validateIdParam('employeeId', 'Employee ID'), validateRequest, employeeController.getEmployeeById);
router.put('/employee/:employeeId', validateEmployeeUpdate, validateRequest, employeeController.updateEmployee);
router.delete('/employee/:employeeId', validateIdParam('employeeId', 'Employee ID'), validateRequest, employeeController.deleteEmployee);

router.get('/:id', validateIdParam('id', 'Client ID'), validateRequest, clientController.getClientById);
router.put('/:id', validateIdParam('id', 'Client ID'), validateClientUpdate, validateRequest, clientController.updateClient);
router.delete('/:id', validateIdParam('id', 'Client ID'), validateRequest, clientController.deleteClient);
router.post('/:id/undelete', validateIdParam('id', 'Client ID'), validateRequest, clientController.unDeleteClient);
router.post('/:id/block', validateIdParam('id', 'Client ID'), validateRequest, clientController.blockClient);
router.post('/:id/unblock', validateIdParam('id', 'Client ID'), validateRequest, clientController.unblockClient);

module.exports = router;