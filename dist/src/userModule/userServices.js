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
            // Resolve manager
            let manager = null;
            if (employeeData.managerEmail) {
                manager = await managerRepo.findOneBy({ email: employeeData.managerEmail });
                if (!manager)
                    throw new Error('Manager with the provided email does not exist.');
            }
            // Create employee with manager relationship only
            const employee = employeeRepository.create({
                fullname: employeeData.fullname,
                email: employeeData.email,
                password: employeeData.password,
                role: employeeData.role,
                manager: manager || null,
                created_at: new Date(employeeData.created_at),
                updated_at: new Date(employeeData.updated_at),
            });
            // Save to DB
            await employeeRepository.save(employee);
            // Initialize leave balances
            await leaveBalanceServices_1.LeaveBalanceService.initializeLeaveBalancesForEmployee(employee.id, employee.role);
            // Generate and return JWT
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
                where: { soft_delete: false },
                relations: ['manager'],
            });
        }
        catch (error) {
            console.error('Error getting employees:', error);
            throw new Error('Failed to get employees!');
        }
    }
    static async getEmployee(id) {
        try {
            const employeeRepository = connection_1.dataSource.getRepository(userEntity_1.Employee);
            return await employeeRepository.findOne({
                where: { id, soft_delete: false },
                relations: ['manager'],
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
    static async softDeleteEmployee(id) {
        const userRepo = connection_1.dataSource.getRepository(userEntity_1.Employee);
        const employee = await userRepo.findOne({ where: { id: id } });
        if (!employee) {
            throw new Error('Employee not found');
        }
        employee.soft_delete = !(employee.soft_delete);
        await userRepo.save(employee);
    }
    static async deletedEmployees() {
        const userRepo = connection_1.dataSource.getRepository(userEntity_1.Employee);
        const employees = await userRepo.find({ where: { soft_delete: true } });
        if (!employees) {
            throw new Error('Employee not found');
        }
        return employees;
    }
}
exports.UserService = UserService;
