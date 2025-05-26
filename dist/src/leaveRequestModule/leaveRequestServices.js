"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveRequestService = void 0;
const connection_1 = require("../../db/connection");
const leaveRequestEntity_1 = require("./leaveRequestEntity");
const userEntity_1 = require("../userModule/userEntity");
const leaveTypeEntity_1 = require("../leaveTypeModule/leaveTypeEntity");
const date_fns_1 = require("date-fns");
const leaveBalanceController_1 = require("../leaveBalanceModule/leaveBalanceController");
const typeorm_1 = require("typeorm");
const leaveRequestValidation_1 = require("./leaveRequestValidation");
const leaveBalanceEntity_1 = require("../leaveBalanceModule/leaveBalanceEntity");
// Define the possible leave request statuses
const APPROVAL = {
    Pending: 'Pending',
    Approved: 'Approved',
    Rejected: 'Rejected',
    Cancelled: 'Cancelled',
    NoManager: 'NotRequired',
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
            const leaveType = await leaveTypeRepository.findOne({
                where: { id: leaveRequestData.leave_type_id
                },
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
                    employee: { id: leaveRequestData.employee_id, soft_delete: false },
                    startDate: (0, typeorm_1.LessThanOrEqual)(endDate),
                    endDate: (0, typeorm_1.MoreThanOrEqual)(startDate),
                    status: (0, typeorm_1.Not)((0, typeorm_1.In)([APPROVAL.Rejected, APPROVAL.Cancelled])),
                },
            });
            if (overlap)
                throw new Error('Leave request overlaps with an existing one');
            const days = (0, date_fns_1.differenceInCalendarDays)(endDate, startDate) + 1;
            const employee = await userRepository.findOne({
                where: { id: leaveRequestData.employee_id, soft_delete: false },
                relations: ['manager'],
            });
            const leaveBalanceRepo = connection_1.dataSource.getRepository(leaveBalanceEntity_1.LeaveBalance);
            const available = await leaveBalanceRepo.find({
                where: {
                    employee_id: leaveRequestData.employee_id,
                    leave_type_id: leaveRequestData.leave_type_id,
                },
            });
            if (days > available[0].remaining_leave) {
                throw new Error(`You can only take ${available[0].remaining_leave} day(s) of leave.`);
            }
            const manager = employee.manager;
            const managerRole = manager?.role;
            // Default to not required
            leaveRequestData.manager_approval = APPROVAL.NoManager;
            leaveRequestData.HR_approval = APPROVAL.NoManager;
            leaveRequestData.director_approval = APPROVAL.NoManager;
            // Determine approval based on number of leave days
            if (days <= 2) {
                if (manager) {
                    if (managerRole === 'HR') {
                        leaveRequestData.manager_approval = APPROVAL.NoManager;
                        leaveRequestData.HR_approval = APPROVAL.Pending;
                    }
                    else {
                        leaveRequestData.manager_approval = APPROVAL.Pending;
                    }
                }
                else {
                    leaveRequestData.manager_approval = APPROVAL.NoManager;
                }
            }
            else if (days > 2 && days < 5) {
                if (manager) {
                    if (managerRole === 'HR') {
                        leaveRequestData.manager_approval = APPROVAL.NoManager;
                        leaveRequestData.HR_approval = APPROVAL.Pending;
                    }
                    else {
                        leaveRequestData.manager_approval = APPROVAL.Pending;
                        leaveRequestData.HR_approval = APPROVAL.Pending;
                    }
                }
                else {
                    leaveRequestData.manager_approval = APPROVAL.NoManager;
                    leaveRequestData.HR_approval = APPROVAL.Pending;
                }
            }
            else if (days >= 5) {
                if (managerRole === 'Director') {
                    leaveRequestData.manager_approval = APPROVAL.NoManager;
                    leaveRequestData.HR_approval = APPROVAL.Pending;
                    leaveRequestData.director_approval = APPROVAL.Pending;
                }
                else if (managerRole === 'HR') {
                    leaveRequestData.manager_approval = APPROVAL.NoManager;
                    leaveRequestData.HR_approval = APPROVAL.Pending;
                    leaveRequestData.director_approval = APPROVAL.Pending;
                }
                else {
                    leaveRequestData.manager_approval = APPROVAL.Pending;
                    leaveRequestData.HR_approval = APPROVAL.Pending;
                    leaveRequestData.director_approval = APPROVAL.Pending;
                }
            }
            leaveRequestData.status = APPROVAL.Pending;
            leaveRequestData.raisedDate = new Date();
            // Handle specific leave types like Sick Leave
            if (leaveType.leave_type === 'Sick Leave') {
                const balance = await leaveBalanceController_1.LeaveBalanceController.patchLeaveBalance(leaveRequestData.employee_id, leaveType.id, days);
                leaveRequestData.manager_approval = APPROVAL.Approved;
                leaveRequestData.HR_approval = APPROVAL.Approved;
                leaveRequestData.director_approval = APPROVAL.Approved;
                leaveRequestData.status = APPROVAL.Approved;
            }
            const leaveRequest = leaveRequestRepository.create(leaveRequestData);
            await leaveRequestRepository.save(leaveRequest);
            if (employee) {
                await this.notifyApprovers(employee, days);
            }
            return leaveRequest;
        }
        catch (error) {
            throw new Error('Failed to create leave request: ' + error.message);
        }
    }
    // Notify the relevant approvers (Manager, HR, Directors)
    static async notifyApprovers(employee, days) {
        const approvers = [];
        try {
            // Get the manager of the employee (if any)
            if (employee.manager) {
                const manager = await connection_1.dataSource.getRepository(userEntity_1.Employee).findOne({
                    where: { id: employee.manager.id, soft_delete: false },
                });
                if (manager)
                    approvers.push(manager);
            }
            // Get all HR users
            const hrUsers = await connection_1.dataSource.getRepository(userEntity_1.Employee).find({
                where: { role: 'HR' },
            });
            // Get all Directors
            const directors = await connection_1.dataSource.getRepository(userEntity_1.Employee).find({
                where: { role: 'Director' },
            });
            // Add all HR and Director users to the approvers list
            approvers.push(...hrUsers, ...directors);
            // Logging approvers (or you can implement email/push notification here)
            console.log(`Notify the following approvers for ${employee.fullname}:`);
            approvers.forEach((approver) => {
                console.log(`- ${approver.fullname} (${approver.role})`);
            });
            // Here you can implement notifications (email, push, etc.)
        }
        catch (error) {
            console.error('Error notifying approvers:', error.message);
        }
    }
    // Get all leave requests for a specific employee
    static async getLeaveRequest(employeeId) {
        const repo = connection_1.dataSource.getRepository(leaveRequestEntity_1.LeaveRequest);
        return repo.find({
            where: { employee: { id: employeeId, soft_delete: false } },
            relations: ['employee', 'leaveType'],
            order: { raisedDate: 'DESC' },
        });
    }
    static async getLeaveRequestAll() {
        const repo = connection_1.dataSource.getRepository(leaveRequestEntity_1.LeaveRequest);
        // Fetch all leave requests, regardless of employee or manager
        return repo.find({ where: {
                employee: {
                    soft_delete: false
                }
            },
            relations: ['employee', 'leaveType'], // Include relations with employee and leaveType
            order: { raisedDate: 'DESC' }, // Order by raisedDate in descending order
        });
    }
    static async getLeaveRequestsForCalendar(managerId) {
        const requestRepo = connection_1.dataSource.getRepository(leaveRequestEntity_1.LeaveRequest);
        const leaveRequests = await requestRepo.find({
            where: {
                employee: {
                    manager: {
                        id: managerId,
                    }, soft_delete: false
                },
            },
            relations: ['employee', 'leaveType'],
            order: {
                raisedDate: 'DESC',
            },
        });
        return leaveRequests;
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
        else if ((manager_approval === APPROVAL.Approved || manager_approval === APPROVAL.NoManager) &&
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
    static async getLeaveRequestsForRole(userId) {
        const repo = connection_1.dataSource.getRepository(leaveRequestEntity_1.LeaveRequest);
        const userRepo = connection_1.dataSource.getRepository(userEntity_1.Employee);
        // Get the logged-in user
        const user = await userRepo.findOne({
            where: { id: userId, soft_delete: false },
            relations: ['manager'],
        });
        if (!user)
            throw new Error('User not found');
        let leaveRequests = [];
        if (user.role === 'HR') {
            // Fetch all leave requests where HR approval is pending
            const allHrRequests = await repo.find({
                where: { HR_approval: 'Pending', employee: {
                        soft_delete: false
                    } },
                relations: ['employee', 'employee.manager', 'leaveType'],
                order: { raisedDate: 'DESC' },
            });
            // Show requests where:
            // 1. HR approval is required AND
            // 2. HR is assigned as the manager OR user is HR by role
            leaveRequests = allHrRequests.filter(req => req.employee.manager?.id === user.id || user.role === 'HR');
        }
        else if (user.role === 'Director') {
            // Show director approvals
            leaveRequests = await repo.find({
                where: { director_approval: 'Pending' },
                relations: ['employee', 'employee.manager', 'leaveType'],
                order: { raisedDate: 'DESC' },
            });
        }
        else if (user.role === 'Manager') {
            // Show requests from managed employees
            leaveRequests = await repo.find({
                where: {
                    employee: { manager: { id: user.id } },
                    manager_approval: 'Pending',
                },
                relations: ['employee', 'leaveType'],
                order: { raisedDate: 'DESC' },
            });
        }
        else {
            // Regular employee: only their own leave requests
            leaveRequests = await repo.find({
                where: { employee: { id: userId } },
                relations: ['employee', 'leaveType'],
                order: { raisedDate: 'DESC' },
            });
        }
        return leaveRequests;
    }
}
exports.LeaveRequestService = LeaveRequestService;
