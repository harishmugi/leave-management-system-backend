"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const connection_1 = require("../../db/connection");
const userEntity_1 = require("./userEntity");
const jwt_1 = require("../utils/jwt");
const leaveBalanceServices_1 = require("../leaveBalanceModule/leaveBalanceServices");
class UserService {
    static async createEmployee(employeeData) {
        const employeeRepository = connection_1.dataSource.getRepository(userEntity_1.Employee);
        try {
            const managerRepo = connection_1.dataSource.getRepository(userEntity_1.Employee);
            // 1. Resolve manager
            let manager = null;
            if (employeeData.managerEmail) {
                manager = await managerRepo.findOneBy({ email: employeeData.managerEmail });
                if (!manager)
                    throw new Error('Manager with the provided email does not exist.');
            }
            // 2. Resolve HR
            let HR = null;
            if (employeeData.hrEmail) {
                HR = await managerRepo.findOneBy({ email: employeeData.hrEmail });
                if (!HR)
                    throw new Error('HR with the provided email does not exist.');
            }
            // 3. Resolve Director
            let director = null;
            if (employeeData.directorEmail) {
                director = await managerRepo.findOneBy({ email: employeeData.directorEmail });
                if (!director)
                    throw new Error('Director with the provided email does not exist.');
            }
            // 4. Create employee with relationships
            const employee = employeeRepository.create({
                fullname: employeeData.fullname,
                email: employeeData.email,
                password: employeeData.password,
                role: employeeData.role,
                manager: manager || null,
                HR: HR || null,
                director: director || null,
                created_at: new Date(employeeData.created_at),
                updated_at: new Date(employeeData.updated_at),
            });
            // 5. Save to DB
            await employeeRepository.save(employee);
            // 6. Initialize leave balances
            await leaveBalanceServices_1.LeaveBalanceService.initializeLeaveBalancesForEmployee(employee.id);
            // 7. Generate and return token
            return (0, jwt_1.generateJwt)(employee);
        }
        catch (error) {
            console.error('Error creating employee:', error);
            throw new Error(error.message || 'Failed to create employee!');
        }
    }
    static async getAllEmployees() {
        try {
            const employeeRepository = connection_1.dataSource.getRepository(userEntity_1.Employee);
            return await employeeRepository.find({
                relations: ['manager', 'HR', 'director'],
            });
        }
        catch (error) {
            console.error('Error getting employees:', error);
            throw new Error('Failed to get employees!');
        }
    }
    static async getEmployee(email) {
        try {
            const employeeRepository = connection_1.dataSource.getRepository(userEntity_1.Employee);
            return await employeeRepository.findOne({
                where: { email },
                relations: ['manager', 'HR', 'director'],
            });
        }
        catch (error) {
            console.error('Error getting employee:', error);
            throw new Error('Failed to get employee!');
        }
    }
    static async updateEmployee(id, updateData) {
        const employeeRepository = connection_1.dataSource.getRepository(userEntity_1.Employee);
        const employee = await employeeRepository.findOneBy({ id });
        if (!employee)
            return null;
        try {
            const updated = employeeRepository.merge(employee, updateData);
            return await employeeRepository.save(updated);
        }
        catch (error) {
            console.error('Error updating employee:', error);
            throw new Error('Failed to update employee!');
        }
    }
    static async deleteEmployee(id) {
        const employeeRepository = connection_1.dataSource.getRepository(userEntity_1.Employee);
        try {
            const result = await employeeRepository.delete(id);
            return result.affected !== 0;
        }
        catch (error) {
            console.error('Error deleting employee:', error);
            throw new Error('Failed to delete employee!');
        }
    }
}
exports.UserService = UserService;
