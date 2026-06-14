const ClientModel = require('../../models/clientModel');
const { parsePositiveInteger, splitFullName } = require('../../../common/utils/normalize');

const getRequestValue = (req = {}, keys = []) => {
     const sources = [req.params, req.query, req.body];

     for (const source of sources) {
          if (!source) continue;

          for (const key of keys) {
               if (source[key] !== undefined && source[key] !== null && source[key] !== '') {
                    return source[key];
               }
          }
     }

     return null;
};

const resolveClientTypeId = async (body = {}) => {
     const rawClientType = body.client_type_id ?? body.client_type ?? body.type_name ?? body.type ?? body.company_id ?? body.company_type;

     if (rawClientType === undefined || rawClientType === null || rawClientType === '') {
          return ClientModel.getDefaultClientTypeId();
     }

     const clientTypeId = parsePositiveInteger(rawClientType);
     if (clientTypeId) {
          const clientTypeExists = await ClientModel.clientTypeExists(clientTypeId);
          return clientTypeExists ? clientTypeId : ClientModel.getDefaultClientTypeId();
     }

     const clientType = await ClientModel.getClientTypeByName(String(rawClientType).trim());
     return clientType ? clientType.id : ClientModel.getDefaultClientTypeId();
};

const normalizeContactEmployee = (body = {}) => {
     const source = body.employee || body.contact || body.client_employee || body.clientEmployee ||
          (Array.isArray(body.employees) ? body.employees[0] : null) ||
          (Array.isArray(body.contacts) ? body.contacts[0] : null) ||
          body;

     const fullName = source.name || source.employee_name || source.contact_name || source.full_name;
     const parsedName = splitFullName(fullName);
     const firstName = source.first_name || source.employee_first_name || source.contact_first_name || parsedName.first_name;
     const lastName = source.last_name || source.employee_last_name || source.contact_last_name || parsedName.last_name;
     const phone = source.phone || source.mobile || source.contact_number || source.employee_phone || source.contact_phone;
     const email = source.email || source.employee_email || source.contact_email;
     const designation = source.designation || source.employee_designation || source.contact_designation || source.position;
     const isAdmin = source.is_admin ?? source.isAdmin ?? source.admin ?? false;
     const tag = source.tag || source.employee_tag || null;

     if (!firstName && !lastName && !phone && !email && !designation && !tag) {
          return null;
     }

     return {
          first_name: String(firstName || '').trim(),
          last_name: lastName ? String(lastName).trim() : null,
          phone: phone ? String(phone).trim() : null,
          email: email ? String(email).trim() : null,
          designation: designation ? String(designation).trim() : null,
          is_admin: isAdmin === true || isAdmin === 1 || isAdmin === '1' || isAdmin === 'true',
          tag: tag ? String(tag).trim() : null
     };
};

const normalizeClientData = (body = {}) => {
     const data = {};

     if (body.company_name !== undefined) data.company_name = String(body.company_name || '').trim();
     if (body.website !== undefined) data.website = body.website ? String(body.website).trim() : null;
     if (body.office_number !== undefined) data.office_number = body.office_number ? String(body.office_number).trim() : null;
     if (body.address !== undefined) data.address = body.address ? String(body.address).trim() : null;
     if (body.description !== undefined) data.description = body.description ? String(body.description).trim() : null;

     return data;
};

module.exports = {
     getRequestValue,
     resolveClientTypeId,
     normalizeContactEmployee,
     normalizeClientData,
     splitFullName
};