const db = require('../../config/db');

const VALID_TEAM_TYPES = ['steelmart', 'generalContractor', 'vendor'];

class PersonnelTeamModel {
    static async getTeamsByProjectId(projectId) {
        try {
            const sql = `
                SELECT 
                    pt.id,
                    pt.project_id,
                    pt.company_id,
                    pt.team_name,
                    pt.team_type,
                    pt.created_by,
                    pt.created_at,
                    pt.updated_at,
                    c.company_name
                FROM personnel_teams pt
                LEFT JOIN companies c ON c.id = pt.company_id
                WHERE pt.project_id = ?
                ORDER BY pt.id ASC
            `;
            const [teams] = await db.query(sql, [projectId]);
            if (teams.length === 0) {
                return [];
            }

            for (const team of teams) {
                const membersSql = `
                    SELECT 
                        e.id,
                        e.first_name,
                        e.last_name,
                        CONCAT(e.first_name, ' ', e.last_name) AS name,
                        e.email,
                        e.phone,
                        e.role AS designation
                    FROM personnel_team_employees pte
                    INNER JOIN employees e ON e.id = pte.employee_id
                    WHERE pte.personnel_team_id = ?
                    ORDER BY e.first_name ASC
                `;
                const [members] = await db.query(membersSql, [team.id]);
                team.members = members;
            }

            return teams;
        } catch (error) {
            throw new Error(`Error fetching personnel teams: ${error.message}`);
        }
    }

    /**
     * Returns employees grouped by team type for a given bid:
     *  - steelmart: all internal (boldmark) employees
     *  - generalContractor: employees from GC companies linked to the bid via project_clients
     *  - vendor: employees from vendor companies linked to the bid via project_vendors
     */
    static async getEmployeesForPersonnel(bidId) {
        try {
            // SteelMart (boldmark) employees
            const [steelmartEmployees] = await db.query(`
                SELECT 
                    e.id, e.company_id,
                    e.first_name, e.last_name,
                    CONCAT(e.first_name, ' ', e.last_name) AS full_name,
                    e.email, e.phone,
                    COALESCE(e.role, 'employee') AS designation,
                    c.id AS company_id, c.company_name
                FROM employees e
                INNER JOIN companies c ON c.id = e.company_id
                WHERE c.company_type = 'steelmart'
                  AND e.status = 'active'
                  AND c.status = 'active'
                ORDER BY e.first_name ASC
            `);

            // GC companies linked to this bid (via bids table selected_general_contractors or project_clients)
            const [gcCompanies] = await db.query(`
                SELECT DISTINCT
                    c.id AS company_id, c.company_name
                FROM companies c
                INNER JOIN employees e ON e.company_id = c.id
                INNER JOIN project_company_employees pce ON pce.company_employee_id = e.id AND pce.project_id = ?
                WHERE c.company_type = 'generalContractor'
                  AND c.status = 'active'
                ORDER BY c.company_name ASC
            `, [bidId]);

            const [gcEmployees] = await db.query(`
                SELECT 
                    e.id, e.company_id,
                    e.first_name, e.last_name,
                    CONCAT(e.first_name, ' ', e.last_name) AS full_name,
                    e.email, e.phone,
                    COALESCE(e.role, 'employee') AS designation,
                    c.id AS company_id, c.company_name
                FROM employees e
                INNER JOIN companies c ON c.id = e.company_id
                INNER JOIN project_company_employees pce ON pce.company_employee_id = e.id AND pce.project_id = ?
                WHERE c.company_type = 'generalContractor'
                  AND e.status = 'active'
                  AND c.status = 'active'
                ORDER BY c.company_name ASC, e.first_name ASC
            `, [bidId]);

            // Vendor companies linked to this bid via project_vendors
            const [vendorCompanies] = await db.query(`
                SELECT DISTINCT
                    c.id AS company_id, c.company_name
                FROM companies c
                INNER JOIN project_vendors pv ON pv.vendor_company_id = c.id AND pv.project_id = ?
                WHERE c.company_type = 'vendor'
                  AND c.status = 'active'
                ORDER BY c.company_name ASC
            `, [bidId]);

            const [vendorEmployees] = await db.query(`
                SELECT 
                    e.id, e.company_id,
                    e.first_name, e.last_name,
                    CONCAT(e.first_name, ' ', e.last_name) AS full_name,
                    e.email, e.phone,
                    COALESCE(e.role, 'employee') AS designation,
                    c.id AS company_id, c.company_name
                FROM employees e
                INNER JOIN companies c ON c.id = e.company_id
                INNER JOIN project_vendors pv ON pv.vendor_company_id = c.id AND pv.project_id = ?
                WHERE c.company_type = 'vendor'
                  AND e.status = 'active'
                  AND c.status = 'active'
                ORDER BY c.company_name ASC, e.first_name ASC
            `, [bidId]);

            return {
                steelmart: steelmartEmployees,
                gcCompanies,
                gcEmployees,
                vendorCompanies,
                vendorEmployees,
            };
        } catch (error) {
            throw new Error(`Error fetching personnel employees: ${error.message}`);
        }
    }

    static async createTeam(projectId, companyId, teamName, teamType, employeeIds, createdBy) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const resolvedType = VALID_TEAM_TYPES.includes(teamType) ? teamType : 'generalContractor';

            const [result] = await connection.query(
                `INSERT INTO personnel_teams (project_id, company_id, team_name, team_type, created_by, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
                [projectId, companyId || null, teamName, resolvedType, createdBy]
            );
            const teamId = result.insertId;

            if (Array.isArray(employeeIds) && employeeIds.length > 0) {
                for (const empId of employeeIds) {
                    await connection.query(
                        `INSERT INTO personnel_team_employees (personnel_team_id, employee_id, created_at, updated_at)
                         VALUES (?, ?, NOW(), NOW())`,
                        [teamId, empId]
                    );
                }
            }

            await connection.commit();
            return teamId;
        } catch (error) {
            await connection.rollback();
            throw new Error(`Error creating personnel team: ${error.message}`);
        } finally {
            connection.release();
        }
    }

    static async updateTeam(teamId, companyId, teamName, teamType, employeeIds, updatedBy) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const resolvedType = VALID_TEAM_TYPES.includes(teamType) ? teamType : 'generalContractor';

            await connection.query(
                `UPDATE personnel_teams 
                 SET company_id = ?, team_name = ?, team_type = ?, updated_by = ?, updated_at = NOW()
                 WHERE id = ?`,
                [companyId || null, teamName, resolvedType, updatedBy, teamId]
            );

            await connection.query(
                `DELETE FROM personnel_team_employees WHERE personnel_team_id = ?`,
                [teamId]
            );

            if (Array.isArray(employeeIds) && employeeIds.length > 0) {
                for (const empId of employeeIds) {
                    await connection.query(
                        `INSERT INTO personnel_team_employees (personnel_team_id, employee_id, created_at, updated_at)
                         VALUES (?, ?, NOW(), NOW())`,
                        [teamId, empId]
                    );
                }
            }

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw new Error(`Error updating personnel team: ${error.message}`);
        } finally {
            connection.release();
        }
    }

    static async deleteTeam(teamId) {
        try {
            const [result] = await db.query(
                `DELETE FROM personnel_teams WHERE id = ?`,
                [teamId]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error deleting personnel team: ${error.message}`);
        }
    }
}

module.exports = PersonnelTeamModel;
