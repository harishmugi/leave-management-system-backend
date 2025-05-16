"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveRequestService = void 0;
const In_1 = require("typeorm/find-options/operator/In");
const connection_1 = require("../../db/connection");
const leaveTypeEntity_1 = require("../leaveTypeModule/leaveTypeEntity");
const userEntity_1 = require("../userModule/userEntity");
const leaveRequestEntity_1 = require("./leaveRequestEntity");
const leaveBalanceEntity_1 = require("../leaveBalanceModule/leaveBalanceEntity");
const date_fns_1 = require("date-fns");
const leaveRequestValidation_1 = require("./leaveRequestValidation");
const leaveBalanceController_1 = require("../leaveBalanceModule/leaveBalanceController");
class LeaveRequestService {
    static async createLeaveRequest(leaveRequestData) {
        const leaveRequestRepository = connection_1.dataSource.getRepository(leaveRequestEntity_1.LeaveRequest);
        const leaveTypeRepository = connection_1.dataSource.getRepository(leaveTypeEntity_1.LeaveType);
        const userRepository = connection_1.dataSource.getRepository(userEntity_1.Employee);
        // Add logging to inspect date fields
        console.log('Start Date:', leaveRequestData.startDate);
        console.log('End Date:', leaveRequestData.endDate);
        if (!(0, leaveRequestValidation_1.isValidDate)(leaveRequestData.startDate) || !(0, leaveRequestValidation_1.isValidDate)(leaveRequestData.endDate)) {
            console.error('Invalid date format');
            throw new Error('Invalid start or end date');
        }
        try {
            const leaveType = await leaveTypeRepository.findOne({ where: { id: leaveRequestData.leave_type_id } });
            if (!leaveType)
                throw new Error("Invalid leave type");
            const startDate = new Date(leaveRequestData.startDate);
            const endDate = new Date(leaveRequestData.endDate);
            // Additional validation for startDate and endDate logic
            if (startDate > endDate) {
                console.error('Start date cannot be after end date');
                throw new Error('Start date cannot be after end date');
            }
            const days = (0, date_fns_1.differenceInCalendarDays)(endDate, startDate) + 1;
            leaveRequestData.manager_approval = 'Pending';
            leaveRequestData.HR_approval = 'Pending';
            leaveRequestData.director_approval = 'Pending';
            leaveRequestData.status = 'Pending';
            leaveRequestData.raisedDate = new Date();
            if (leaveType.leave_type === 'Sick Leave') {
                leaveRequestData.manager_approval = 'Approved';
                leaveRequestData.HR_approval = 'Approved';
                leaveRequestData.director_approval = 'Approved';
                leaveRequestData.status = 'Approved';
            }
            const leaveRequest = leaveRequestRepository.create({ ...leaveRequestData });
            await leaveRequestRepository.save(leaveRequest);
            if (leaveType.leave_type !== 'Sick Leave') {
                const employee = await userRepository.findOne({ where: { id: leaveRequestData.employee_id } });
                if (employee)
                    await this.notifyApprovers(employee, days);
            }
            return leaveRequest;
        }
        catch (error) {
            console.error('Error creating leave request:', error);
            throw new Error('Failed to create leave request');
        }
    }
    static async notifyApprovers(employee, days) {
        const roles = ['manager'];
        if (days > 1)
            roles.push('HR');
        if (days > 5)
            roles.push('director');
        console.log(`Notify ${roles.join(', ')} for ${employee.fullname}`);
    }
    static async getAllLeaveRequest(employeeIds) {
        const repo = connection_1.dataSource.getRepository(leaveRequestEntity_1.LeaveRequest);
        return repo.find({
            where: { employee: { id: (0, In_1.In)(employeeIds) } },
            relations: ['employee', 'leaveType'],
            order: { raisedDate: 'DESC' }
        });
    }
    static async getLeaveRequest(employeeId) {
        console.log("hitttted");
        const repo = connection_1.dataSource.getRepository(leaveRequestEntity_1.LeaveRequest);
        return repo.find({
            where: { employee_id: employeeId },
            relations: ['employee', 'leaveType'],
            order: { raisedDate: 'DESC' }
        });
    }
    static async getLeaveRequestsForRole(roleId) {
        const employeeRepo = connection_1.dataSource.getRepository(userEntity_1.Employee);
        const leaveRepo = connection_1.dataSource.getRepository(leaveRequestEntity_1.LeaveRequest);
        console.log("hittted");
        const roleEmployee = await employeeRepo.findOne({ where: { id: roleId } });
        if (!roleEmployee)
            throw new Error('Approver not found');
        console.log();
        const role = roleEmployee.role;
        console.log('Role:', role);
        if (role === 'Manager') {
            const employees = await employeeRepo.find({
                where: { manager: { id: roleEmployee.id } }
            });
            const employeeIds = employees.map(emp => emp.id);
            console.log('Direct reports:', employeeIds);
            if (employeeIds.length === 0)
                return [];
            return await LeaveRequestService.getAllLeaveRequest(employeeIds);
        }
        else if (role === 'HR') {
            return await leaveRepo.find({
                where: {
                    manager_approval: 'Approved',
                    HR_approval: 'Pending'
                },
                relations: ['employee', 'leaveType'],
                order: { raisedDate: 'DESC' }
            });
        }
        else if (role === 'Director') {
            console.log("role", role);
            return await leaveRepo.find({
                where: {
                    manager_approval: 'Approved',
                    HR_approval: 'Approved',
                    director_approval: 'Pending'
                },
                relations: ['employee', 'leaveType'],
                order: { raisedDate: 'DESC' }
            });
        }
        else if (role === "Employee") {
            return await leaveRepo.find({
                where: {
                    employee_id: roleEmployee.id
                },
                relations: ['employee', 'leaveType'],
                order: { raisedDate: 'DESC' }
            });
        }
        else {
            throw new Error('Invalid role');
        }
    }
    static async updateLeaveRequest(id, updateData) {
        const repo = connection_1.dataSource.getRepository(leaveRequestEntity_1.LeaveRequest);
        const balanceRepo = connection_1.dataSource.getRepository(leaveBalanceEntity_1.LeaveBalance);
        const request = await repo.findOne({ where: { id }, relations: ['employee', 'leaveType'] });
        if (!request)
            throw new Error('Leave request not found');
        const wasPending = request.status === 'Pending';
        const updated = repo.merge(request, updateData);
        const { manager_approval, HR_approval, director_approval } = updated;
        if ([manager_approval, HR_approval, director_approval].includes('Rejected')) {
            updated.status = 'Rejected';
        }
        else if (manager_approval === 'Approved' &&
            HR_approval === 'Approved' &&
            director_approval === 'Approved') {
            updated.status = 'Approved';
        }
        else {
            updated.status = 'Pending';
        }
        const saved = await repo.save(updated);
        if (wasPending && saved.status === 'Approved') {
            const days = (0, date_fns_1.differenceInCalendarDays)(new Date(request.endDate), new Date(request.startDate)) + 1;
            const balance = await leaveBalanceController_1.LeaveBalanceController.patchLeaveBalance(updated.employee_id, saved.leaveType.id, days);
            if (balance < days)
                throw new Error('Insufficient leave balance');
        }
        return saved;
    }
    static async deleteLeaveRequest(id) {
        const repo = connection_1.dataSource.getRepository(leaveRequestEntity_1.LeaveRequest);
        const result = await repo.delete(id);
        return result.affected !== 0;
    }
}
exports.LeaveRequestService = LeaveRequestService;
