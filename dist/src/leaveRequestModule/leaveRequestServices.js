"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveRequestService = void 0;
const typeorm_1 = require("typeorm");
const connection_1 = require("../../db/connection");
const leaveTypeEntity_1 = require("../leaveTypeModule/leaveTypeEntity");
const userEntity_1 = require("../userModule/userEntity");
const leaveRequestEntity_1 = require("./leaveRequestEntity");
const date_fns_1 = require("date-fns");
const leaveRequestValidation_1 = require("./leaveRequestValidation");
const leaveBalanceController_1 = require("../leaveBalanceModule/leaveBalanceController");
const APPROVAL = {
    Pending: 'Pending',
    Approved: 'Approved',
    Rejected: 'Rejected',
    Cancelled: 'Cancelled',
};
class LeaveRequestService {
    // Create a new leave request
    static async createLeaveRequest(leaveRequestData) {
        const leaveRequestRepository = connection_1.dataSource.getRepository(leaveRequestEntity_1.LeaveRequest);
        const leaveTypeRepository = connection_1.dataSource.getRepository(leaveTypeEntity_1.LeaveType);
        const userRepository = connection_1.dataSource.getRepository(userEntity_1.Employee);
        if (!(0, leaveRequestValidation_1.isValidDate)(leaveRequestData.startDate) || !(0, leaveRequestValidation_1.isValidDate)(leaveRequestData.endDate)) {
            throw new Error('Invalid start or end date');
        }
        try {
            // Find leave type
            const leaveType = await leaveTypeRepository.findOne({
                where: { id: leaveRequestData.leave_type_id },
            });
            if (!leaveType)
                throw new Error('Invalid leave type');
            const startDate = new Date(leaveRequestData.startDate);
            const endDate = new Date(leaveRequestData.endDate);
            if (startDate > endDate) {
                throw new Error('Start date cannot be after end date');
            }
            // Check for overlapping leave requests
            const overlap = await leaveRequestRepository.findOne({
                where: {
                    employee: { id: leaveRequestData.employee_id },
                    startDate: (0, typeorm_1.LessThanOrEqual)(endDate),
                    endDate: (0, typeorm_1.MoreThanOrEqual)(startDate),
                    status: (0, typeorm_1.Not)((0, typeorm_1.In)([APPROVAL.Rejected, APPROVAL.Cancelled]))
                },
            });
            if (overlap)
                throw new Error('Leave request overlaps with an existing one');
            const days = (0, date_fns_1.differenceInCalendarDays)(endDate, startDate) + 1;
            // Default status for new requests
            leaveRequestData.manager_approval = APPROVAL.Pending;
            leaveRequestData.HR_approval = APPROVAL.Pending;
            leaveRequestData.director_approval = APPROVAL.Pending;
            leaveRequestData.status = APPROVAL.Pending;
            leaveRequestData.raisedDate = new Date();
            // Handle specific leave types
            if (leaveType.leave_type === 'Sick Leave') {
                const balance = await leaveBalanceController_1.LeaveBalanceController.patchLeaveBalance(leaveRequestData.employee_id, leaveType.id, days);
                if (balance < days)
                    throw new Error('Insufficient leave balance');
                // Automatically approve sick leave if balance is sufficient
                leaveRequestData.manager_approval = APPROVAL.Approved;
                leaveRequestData.HR_approval = APPROVAL.Approved;
                leaveRequestData.director_approval = APPROVAL.Approved;
                leaveRequestData.status = APPROVAL.Approved;
            }
            // Create and save the leave request
            const leaveRequest = leaveRequestRepository.create(leaveRequestData);
            await leaveRequestRepository.save(leaveRequest);
            // Notify approvers if it's not a sick leave
            if (leaveType.leave_type !== 'Sick Leave') {
                const employee = await userRepository.findOne({ where: { id: leaveRequestData.employee_id } });
                if (employee)
                    await this.notifyApprovers(employee, days);
            }
            return leaveRequest;
        }
        catch (error) {
            throw new Error('Failed to create leave request: ' + error.message);
        }
    }
    // Notify the relevant approvers based on the leave duration
    static async notifyApprovers(employee, days) {
        const roles = ['manager'];
        if (days > 1)
            roles.push('HR');
        if (days > 5)
            roles.push('director');
        console.log(`Notify ${roles.join(', ')} for ${employee.fullname}`);
    }
    // Get all leave requests that are pending for a list of employees
    static async getAllLeaveRequest(employeeIds) {
        const repo = connection_1.dataSource.getRepository(leaveRequestEntity_1.LeaveRequest);
        return repo.find({
            where: { employee: { id: (0, typeorm_1.In)(employeeIds) }, status: APPROVAL.Pending },
            relations: ['employee', 'leaveType'],
            order: { raisedDate: 'DESC' },
        });
    }
    // Get all leave requests for a specific employee
    static async getLeaveRequest(employeeId) {
        const repo = connection_1.dataSource.getRepository(leaveRequestEntity_1.LeaveRequest);
        return repo.find({
            where: { employee: { id: employeeId } },
            relations: ['employee', 'leaveType'],
            order: { raisedDate: 'DESC' },
        });
    }
    // Get leave requests that need approval for a specific role
    static async getLeaveRequestsForRole(roleId) {
        const employeeRepo = connection_1.dataSource.getRepository(userEntity_1.Employee);
        const leaveRepo = connection_1.dataSource.getRepository(leaveRequestEntity_1.LeaveRequest);
        const currentUser = await employeeRepo.findOne({ where: { id: roleId } });
        if (!currentUser)
            throw new Error('Approver not found');
        const role = currentUser.role;
        if (role === 'Manager') {
            // Manager views leave requests from their direct reports
            const reports = await employeeRepo.find({
                where: { manager: { id: currentUser.id } },
            });
            const reportIds = reports.map((emp) => emp.id);
            return leaveRepo.find({
                where: {
                    employee: { id: (0, typeorm_1.In)(reportIds) },
                    manager_approval: APPROVAL.Pending,
                },
                relations: ['employee', 'leaveType'],
                order: { raisedDate: 'DESC' },
            });
        }
        else if (role === 'HR') {
            // HR views leave requests approved by Manager and pending HR approval
            return leaveRepo.find({
                where: {
                    manager_approval: APPROVAL.Approved,
                    HR_approval: APPROVAL.Pending,
                },
                relations: ['employee', 'leaveType'],
                order: { raisedDate: 'DESC' },
            });
        }
        else if (role === 'Director') {
            // Director views leave requests approved by Manager and HR, pending Director approval
            const directReports = await employeeRepo.find({
                where: { director: { id: currentUser.id } },
            });
            const managerIds = directReports
                .filter((e) => e.role === 'Manager')
                .map((m) => m.id);
            const employeeReports = await employeeRepo.find({
                where: { manager: { id: (0, typeorm_1.In)(managerIds) } },
            });
            const allRelevantIds = [
                ...directReports.map((e) => e.id),
                ...employeeReports.map((e) => e.id),
            ];
            return leaveRepo.find({
                where: {
                    employee: { id: (0, typeorm_1.In)(allRelevantIds) },
                    manager_approval: APPROVAL.Approved,
                    HR_approval: APPROVAL.Approved,
                    director_approval: APPROVAL.Pending,
                },
                relations: ['employee', 'leaveType'],
                order: { raisedDate: 'DESC' },
            });
        }
        else if (role === 'Employee') {
            // Employee views their own leave requests
            return leaveRepo.find({
                where: { employee: { id: currentUser.id } },
                relations: ['employee', 'leaveType'],
                order: { raisedDate: 'DESC' },
            });
        }
        throw new Error('Invalid role');
    }
    // Update a leave request status and handle leave approval
    static async updateLeaveRequest(id, updateData) {
        const repo = connection_1.dataSource.getRepository(leaveRequestEntity_1.LeaveRequest);
        const request = await repo.findOne({ where: { id }, relations: ['employee', 'leaveType'] });
        if (!request)
            throw new Error('Leave request not found');
        const wasPending = request.status === APPROVAL.Pending;
        const updated = repo.merge(request, updateData);
        const { manager_approval, HR_approval, director_approval } = updated;
        // Handle Rejected and Approved statuses
        if ([manager_approval, HR_approval, director_approval].includes(APPROVAL.Rejected)) {
            updated.status = APPROVAL.Rejected;
        }
        else if (manager_approval === APPROVAL.Approved &&
            HR_approval === APPROVAL.Approved &&
            director_approval === APPROVAL.Approved) {
            const days = (0, date_fns_1.differenceInCalendarDays)(new Date(request.endDate), new Date(request.startDate)) + 1;
            const balance = await leaveBalanceController_1.LeaveBalanceController.patchLeaveBalance(updated.employee.id, updated.leaveType.id, days);
            if (balance < days)
                throw new Error('Insufficient leave balance');
            updated.status = APPROVAL.Approved;
        }
        else {
            updated.status = APPROVAL.Pending;
        }
        return await repo.save(updated);
    }
    // Delete a leave request by its ID
    static async deleteLeaveRequest(id) {
        const repo = connection_1.dataSource.getRepository(leaveRequestEntity_1.LeaveRequest);
        const result = await repo.delete(id);
        return result.affected !== 0;
    }
}
exports.LeaveRequestService = LeaveRequestService;
