const FinancialsAdminModel = require('../models/financialsAdminModel');
const { sendSuccess, sendError } = require('../../common/utils/apiResponse');

const getFinancialsData = async (req, res, next) => {
    try {
        const { id: projectId } = req.params;
        const data = await FinancialsAdminModel.getFinancialsByProjectId(projectId);
        return sendSuccess(res, 'Financials data fetched successfully', data);
    } catch (error) {
        return sendError(res, 500, `Error fetching financials data: ${error.message}`);
    }
};

const updateExpenses = async (req, res, next) => {
    try {
        const { id: projectId } = req.params;
        await FinancialsAdminModel.updateFinancials(projectId, req.body);
        return sendSuccess(res, 'Project expenses updated successfully');
    } catch (error) {
        return sendError(res, 500, `Error updating expenses: ${error.message}`);
    }
};

const addChangeOrder = async (req, res, next) => {
    try {
        const { id: projectId } = req.params;
        const data = await FinancialsAdminModel.addChangeOrder(projectId, req.body);
        return sendSuccess(res, 'Change order added successfully', data);
    } catch (error) {
        return sendError(res, 500, `Error adding change order: ${error.message}`);
    }
};

const updateChangeOrderStatus = async (req, res, next) => {
    try {
        const { id, status } = req.body;
        await FinancialsAdminModel.updateChangeOrderStatus(id, status);
        return sendSuccess(res, 'Change order status updated successfully');
    } catch (error) {
        return sendError(res, 500, `Error updating change order status: ${error.message}`);
    }
};

const addPayment = async (req, res, next) => {
    try {
        const { id: projectId } = req.params;
        const data = await FinancialsAdminModel.addPayment(projectId, req.body);
        return sendSuccess(res, 'Payment added successfully', data);
    } catch (error) {
        return sendError(res, 500, `Error adding payment: ${error.message}`);
    }
};

const addComplianceDocument = async (req, res, next) => {
    try {
        const { id: projectId } = req.params;
        const data = await FinancialsAdminModel.addComplianceDocument(projectId, req.body);
        return sendSuccess(res, 'Compliance document added successfully', data);
    } catch (error) {
        return sendError(res, 500, `Error adding compliance document: ${error.message}`);
    }
};

const updateComplianceDocumentStatus = async (req, res, next) => {
    try {
        const { id, status } = req.body;
        await FinancialsAdminModel.updateComplianceDocumentStatus(id, status);
        return sendSuccess(res, 'Compliance document status updated successfully');
    } catch (error) {
        return sendError(res, 500, `Error updating compliance document status: ${error.message}`);
    }
};

module.exports = {
    getFinancialsData,
    updateExpenses,
    addChangeOrder,
    updateChangeOrderStatus,
    addPayment,
    addComplianceDocument,
    updateComplianceDocumentStatus
};
