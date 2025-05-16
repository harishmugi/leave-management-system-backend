"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveTypeService = void 0;
const connection_1 = require("../../db/connection");
const leaveTypeEntity_1 = require("./leaveTypeEntity");
class LeaveTypeService {
    //CREATE LEAVE TYPE================================================================================================================================
    static async createLeaveType(leaveTypeData) {
        const leaveTypeRepository = connection_1.dataSource.getRepository(leaveTypeEntity_1.LeaveType);
        try {
            const leaveType = leaveTypeRepository.create({ ...leaveTypeData });
            await leaveTypeRepository.save(leaveType);
            return leaveType;
        }
        catch (error) {
            console.error('Error creating leaveType!:', error);
            throw new Error('Failed to create leaveType!');
        }
    }
    //GET USERS==================================================================================================================================
    static async getAllLeaveType() {
        try {
            const leaveTypeRepository = connection_1.dataSource.getRepository(leaveTypeEntity_1.LeaveType);
            return await leaveTypeRepository.find();
        }
        catch (error) {
            console.error('Error in getting!', error);
            throw new Error('Failed to get!');
        }
    }
    static async getLeaveType(leave_type) {
        try {
            const leaveTypeRepository = connection_1.dataSource.getRepository(leaveTypeEntity_1.LeaveType);
            return await leaveTypeRepository.findOneBy({ leave_type }); // Pass as an object
        }
        catch (error) {
            console.error('Error in getting leave type!', error);
            throw new Error('Failed to get leave type!');
        }
    }
    //UPDATE=================================================================================================================================
    static async updateLeaveType(id, updateData) {
        const leaveTypeRepository = connection_1.dataSource.getRepository(leaveTypeEntity_1.LeaveType);
        const leaveType = await leaveTypeRepository.findOneBy({ id });
        if (!leaveType) {
            return null;
        }
        try {
            const updated = leaveTypeRepository.merge(leaveType, updateData);
            return await leaveTypeRepository.save(updated);
        }
        catch (error) {
            console.error('Error in updating!', error);
            throw new Error('Failed to update!');
        }
    }
    //DELETE===============================================================================================================================
    static async deleteLeaveType(id) {
        const leaveTypeRepository = connection_1.dataSource.getRepository(leaveTypeEntity_1.LeaveType);
        try {
            const result = await leaveTypeRepository.delete(id);
            return result.affected !== 0; // true if deletion occurred
        }
        catch (error) {
            console.error('Error in deletion!', error);
            throw new Error('Failed to delete!');
        }
    }
}
exports.LeaveTypeService = LeaveTypeService;
