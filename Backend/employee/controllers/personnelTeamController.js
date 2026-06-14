const PersonnelTeamModel = require('../models/personnelTeamModel');
const EmployeeModel = require('../models/employeeModel');
const { sendSuccess, sendError } = require('../../common/utils/apiResponse');

const VALID_TEAM_TYPES = ['steelmart', 'generalContractor', 'vendor'];

const normalizeId = (value) => {
    const parsedId = Number(value);
    return Number.isInteger(parsedId) && parsedId > 0 ? parsedId : null;
};

const getTeams = async (req, res, next) => {
    try {
        const bidId = normalizeId(req.params.bidId || req.query.bidId);
        if (!bidId) {
            return sendError(res, 400, 'Valid Bid/Project ID is required.');
        }

        const teams = await PersonnelTeamModel.getTeamsByProjectId(bidId);
        return sendSuccess(res, 'Personnel teams fetched successfully', { teams });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /bids/:bidId/personnel-teams/employees
 * Returns employees grouped by team type (steelmart, gc, vendor) for the Add Team modal.
 */
const getPersonnelEmployees = async (req, res, next) => {
    try {
        const bidId = normalizeId(req.params.bidId || req.query.bidId);
        if (!bidId) {
            return sendError(res, 400, 'Valid Bid/Project ID is required.');
        }

        const data = await PersonnelTeamModel.getEmployeesForPersonnel(bidId);
        return sendSuccess(res, 'Personnel employees fetched successfully', data);
    } catch (error) {
        next(error);
    }
};

const createTeam = async (req, res, next) => {
    try {
        const bidId = normalizeId(req.params.bidId || req.body.bidId);
        if (!bidId) {
            return sendError(res, 400, 'Valid Bid/Project ID is required.');
        }

        const { company_id, team_name, team_type, employee_ids, new_members } = req.body;
        if (!team_name || !team_name.trim()) {
            return sendError(res, 400, 'Team name is required.');
        }

        if (team_type && !VALID_TEAM_TYPES.includes(team_type)) {
            return sendError(res, 400, `Invalid team type. Must be one of: ${VALID_TEAM_TYPES.join(', ')}`);
        }

        const createdBy = req.user?.id;
        if (!createdBy) {
            return sendError(res, 401, 'Unable to resolve user identity.');
        }

        const companyId = normalizeId(company_id);
        let parsedEmployeeIds = Array.isArray(employee_ids)
            ? employee_ids.map(normalizeId).filter(Boolean)
            : [];

        // If new members were provided (for GC/Vendor), create them first and add their IDs
        if (Array.isArray(new_members) && new_members.length > 0 && companyId) {
            for (const member of new_members) {
                if (!member.first_name) continue;
                try {
                    const newEmpId = await EmployeeModel.createEmployee(companyId, {
                        first_name: member.first_name,
                        last_name: member.last_name || '',
                        phone: member.phone || null,
                        email: member.email || null,
                        role: member.designation || 'employee',
                        is_admin: 0,
                    }, createdBy);
                    if (newEmpId) parsedEmployeeIds.push(newEmpId);
                } catch (empErr) {
                    // Log but don't fail the whole request for duplicate/invalid entries
                    console.warn(`Skipping new member creation: ${empErr.message}`);
                }
            }
        }

        const teamId = await PersonnelTeamModel.createTeam(
            bidId,
            companyId,
            team_name.trim(),
            team_type || 'generalContractor',
            parsedEmployeeIds,
            createdBy
        );

        // Fetch updated teams
        const updatedTeams = await PersonnelTeamModel.getTeamsByProjectId(bidId);
        return sendSuccess(res, 'Personnel team created successfully', { teamId, teams: updatedTeams });
    } catch (error) {
        next(error);
    }
};

const updateTeam = async (req, res, next) => {
    try {
        const teamId = normalizeId(req.params.teamId);
        const bidId = normalizeId(req.params.bidId || req.body.bidId);
        if (!teamId) {
            return sendError(res, 400, 'Valid Team ID is required.');
        }

        const { company_id, team_name, team_type, employee_ids, new_members } = req.body;
        if (!team_name || !team_name.trim()) {
            return sendError(res, 400, 'Team name is required.');
        }

        if (team_type && !VALID_TEAM_TYPES.includes(team_type)) {
            return sendError(res, 400, `Invalid team type. Must be one of: ${VALID_TEAM_TYPES.join(', ')}`);
        }

        const updatedBy = req.user?.id;
        if (!updatedBy) {
            return sendError(res, 401, 'Unable to resolve user identity.');
        }

        const companyId = normalizeId(company_id);
        let parsedEmployeeIds = Array.isArray(employee_ids)
            ? employee_ids.map(normalizeId).filter(Boolean)
            : [];

        // If new members were provided, create them and add their IDs
        if (Array.isArray(new_members) && new_members.length > 0 && companyId) {
            for (const member of new_members) {
                if (!member.first_name) continue;
                try {
                    const newEmpId = await EmployeeModel.createEmployee(companyId, {
                        first_name: member.first_name,
                        last_name: member.last_name || '',
                        phone: member.phone || null,
                        email: member.email || null,
                        role: member.designation || 'employee',
                        is_admin: 0,
                    }, updatedBy);
                    if (newEmpId) parsedEmployeeIds.push(newEmpId);
                } catch (empErr) {
                    console.warn(`Skipping new member creation: ${empErr.message}`);
                }
            }
        }

        await PersonnelTeamModel.updateTeam(
            teamId,
            companyId,
            team_name.trim(),
            team_type || 'generalContractor',
            parsedEmployeeIds,
            updatedBy
        );

        // Fetch updated teams if project_id/bidId was provided
        let updatedTeams = [];
        if (bidId) {
            updatedTeams = await PersonnelTeamModel.getTeamsByProjectId(bidId);
        }

        return sendSuccess(res, 'Personnel team updated successfully', { teams: updatedTeams });
    } catch (error) {
        next(error);
    }
};

const deleteTeam = async (req, res, next) => {
    try {
        const teamId = normalizeId(req.params.teamId);
        const bidId = normalizeId(req.params.bidId || req.query.bidId);
        if (!teamId) {
            return sendError(res, 400, 'Valid Team ID is required.');
        }

        await PersonnelTeamModel.deleteTeam(teamId);

        // Fetch updated teams if project_id/bidId was provided
        let updatedTeams = [];
        if (bidId) {
            updatedTeams = await PersonnelTeamModel.getTeamsByProjectId(bidId);
        }

        return sendSuccess(res, 'Personnel team deleted successfully', { teams: updatedTeams });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getTeams,
    getPersonnelEmployees,
    createTeam,
    updateTeam,
    deleteTeam
};
