"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveBalanceService = void 0;
const connection_1 = require("../../db/connection");
const leaveBalanceEntity_1 = require("./leaveBalanceEntity");
class LeaveBalanceService {
    //CREATE LEAVE BALANCE================================================================================================================================
    static async createLeaveBalance(leaveBalanceData) {
        const leaveBalanceRepository = connection_1.dataSource.getRepository(leaveBalanceEntity_1.LeaveBalance);
        console.log("hitted again");
        try {
            const leaveBalance = leaveBalanceRepository.create({ ...leaveBalanceData });
            await leaveBalanceRepository.save(leaveBalance);
            return leaveBalance;
        }
        catch (error) {
            console.error('Error creating leaveBalance!:', error);
            throw new Error('Failed to create leaveBalance!');
        }
    }
    //GET USERS==================================================================================================================================
    static async getAllLeaveBalance(id) {
        try {
            const leaveBalanceRepository = connection_1.dataSource.getRepository(leaveBalanceEntity_1.LeaveBalance);
            return await leaveBalanceRepository.find({ where: { employee_id: id }, relations: ['leaveType'] });
        }
        catch (error) {
            console.error('Error in getting!', error);
            throw new Error('Failed to get!');
        }
    }
    //UPDATE=================================================================================================================================
    static async updateLeaveBalance(id, updateData) {
        const leaveBalanceRepository = connection_1.dataSource.getRepository(leaveBalanceEntity_1.LeaveBalance);
        const leaveBalance = await leaveBalanceRepository.findOneBy({ id });
        if (!leaveBalance) {
            return null;
        }
        try {
            const updated = leaveBalanceRepository.merge(leaveBalance, updateData);
            return await leaveBalanceRepository.save(updated);
        }
        catch (error) {
            console.error('Error in updating!', error);
            throw new Error('Failed to update!');
        }
    }
    //DELETE===============================================================================================================================
    static async deleteLeaveBalance(id) {
        const leaveBalanceRepository = connection_1.dataSource.getRepository(leaveBalanceEntity_1.LeaveBalance);
        try {
            const result = await leaveBalanceRepository.delete(id);
            return result.affected !== 0; // true if deletion occurred
        }
        catch (error) {
            console.error('Error in deletion!', error);
            throw new Error('Failed to delete!');
        }
    }
    static async initializeLeaveBalancesForEmployee(employeeId) {
        const leaveTypeRepo = connection_1.dataSource.getRepository(leaveTypeEntity_1.LeaveType);
        const leaveBalanceRepo = connection_1.dataSource.getRepository(leaveBalanceEntity_1.LeaveBalance);
        const leaveTypes = await leaveTypeRepo.find();
        const leaveBalances = leaveTypes.map(type => {
            const balance = new leaveBalanceEntity_1.LeaveBalance();
            balance.employee_id = employeeId;
            balance.leave_type_id = type.id;
            balance.allocated_leave = 20; // or custom per type
            balance.used_leave = 0;
            balance.remaining_leave = 20;
            return balance;
        });
        await leaveBalanceRepo.save(leaveBalances);
    }
}
exports.LeaveBalanceService = LeaveBalanceService;
const leaveTypeEntity_1 = require("../leaveTypeModule/leaveTypeEntity");
