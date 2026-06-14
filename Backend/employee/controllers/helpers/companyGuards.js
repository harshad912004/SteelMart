const ClientModel = require('../../models/clientModel');
const { buildPagination } = require('../../../common/utils/pagination');

const emptyEmployeePage = (page = 1, limit = 3) => ({
     data: [],
     total: 0,
     page,
     limit,
     pages: 0
});

const getClientById = async (clientId) => {
     if (!clientId) {
          return null;
     }
     return ClientModel.getClientById(clientId);
};

const ensureClientExists = async (clientId) => {
     const client = await getClientById(clientId);
     if (!client) {
          return { error: { statusCode: 404, message: 'Company not found' } };
     }
     return { client };
};

const clientBlockedPageResponse = (res, page = 1, limit = 3) => {
     const result = emptyEmployeePage(Number(page) || 1, Number(limit) || 3);
     return res.status(200).json({
          success: true,
          message: 'Client is blocked',
          data: result,
          pagination: buildPagination(result)
     });
};

const clientBlockedEmptyDataResponse = (res) => res.status(200).json({
     success: true,
     message: 'Client is blocked',
     data: []
});

module.exports = {
     ensureClientExists,
     clientBlockedPageResponse,
     clientBlockedEmptyDataResponse
};