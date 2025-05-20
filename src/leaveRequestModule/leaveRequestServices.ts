import { In, LessThanOrEqual, MoreThanOrEqual, Not } from 'typeorm';
import { dataSource } from '../../db/connection';
import { LeaveType } from '../leaveTypeModule/leaveTypeEntity';
import { Employee } from '../userModule/userEntity';
import { LeaveRequest } from './leaveRequestEntity';
import { differenceInCalendarDays } from 'date-fns';
import { isValidDate } from './leaveRequestValidation';
import { LeaveBalanceController } from '../leaveBalanceModule/leaveBalanceController';

const APPROVAL = {
  Pending: 'Pending' as const,
  Approved: 'Approved' as const,
  Rejected: 'Rejected' as const,
  Cancelled: 'Cancelled' as const,
};

export class LeaveRequestService {
  // Create a new leave request
  static async createLeaveRequest(leaveRequestData: any) {
    const leaveRequestRepository = dataSource.getRepository(LeaveRequest);
    const leaveTypeRepository = dataSource.getRepository(LeaveType);
    const userRepository = dataSource.getRepository(Employee);

    if (!isValidDate(leaveRequestData.startDate) || !isValidDate(leaveRequestData.endDate)) {
      throw new Error('Invalid start or end date');
    }

    try {
      // Find leave type
      const leaveType = await leaveTypeRepository.findOne({
        where: { id: leaveRequestData.leave_type_id },
      });
      if (!leaveType) throw new Error('Invalid leave type');

      const startDate = new Date(leaveRequestData.startDate);
      const endDate = new Date(leaveRequestData.endDate);

      if (startDate > endDate) {
        throw new Error('Start date cannot be after end date');
      }

      // Check for overlapping leave requests
      const overlap = await leaveRequestRepository.findOne({
        where: {
          employee: { id: leaveRequestData.employee_id },
          startDate: LessThanOrEqual(endDate),
          endDate: MoreThanOrEqual(startDate),
          status: Not(In([APPROVAL.Rejected, APPROVAL.Cancelled])) 
        },
      });

      if (overlap) throw new Error('Leave request overlaps with an existing one');

      const days = differenceInCalendarDays(endDate, startDate) + 1;

      // Default status for new requests
      leaveRequestData.manager_approval = APPROVAL.Pending;
      leaveRequestData.HR_approval = APPROVAL.Pending;
      leaveRequestData.director_approval = APPROVAL.Pending;
      leaveRequestData.status = APPROVAL.Pending;
      leaveRequestData.raisedDate = new Date();

      // Handle specific leave types
      if (leaveType.leave_type === 'Sick Leave') {
        const balance = await LeaveBalanceController.patchLeaveBalance(
          leaveRequestData.employee_id,
          leaveType.id,
          days
        );
        if (balance < days) throw new Error('Insufficient leave balance');

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
        if (employee) await this.notifyApprovers(employee, days);
      }

      return leaveRequest;
    } catch (error: any) {
      throw new Error('Failed to create leave request: ' + error.message);
    }
  }

  // Notify the relevant approvers based on the leave duration
  static async notifyApprovers(employee: Employee, days: number) {
    const roles = ['manager'];
    if (days > 1) roles.push('HR');
    if (days > 5) roles.push('director');
    console.log(`Notify ${roles.join(', ')} for ${employee.fullname}`);
  }

  // Get all leave requests that are pending for a list of employees
  static async getAllLeaveRequest(employeeIds: string[]) {
    const repo = dataSource.getRepository(LeaveRequest);
    return repo.find({
      where: { employee: { id: In(employeeIds) }, status: APPROVAL.Pending },
      relations: ['employee', 'leaveType'],
      order: { raisedDate: 'DESC' },
    });
  }

  // Get all leave requests for a specific employee
  static async getLeaveRequest(employeeId: string) {
    const repo = dataSource.getRepository(LeaveRequest);
    return repo.find({
      where: { employee: { id: employeeId } },
      relations: ['employee', 'leaveType'],
      order: { raisedDate: 'DESC' },
    });
  }

  // Get leave requests that need approval for a specific role
  static async getLeaveRequestsForRole(roleId: string) {
    const employeeRepo = dataSource.getRepository(Employee);
    const leaveRepo = dataSource.getRepository(LeaveRequest);

    const currentUser = await employeeRepo.findOne({ where: { id: roleId } });

    if (!currentUser) throw new Error('Approver not found');
    const role = currentUser.role;

    if (role === 'Manager') {
      // Manager views leave requests from their direct reports
      const reports = await employeeRepo.find({
        where: { manager: { id: currentUser.id } },
      });
      const reportIds = reports.map((emp) => emp.id);

      return leaveRepo.find({
        where: {
          employee: { id: In(reportIds) },
          manager_approval: APPROVAL.Pending,
        },
        relations: ['employee', 'leaveType'],
        order: { raisedDate: 'DESC' },
      });
    } else if (role === 'HR') {
      // HR views leave requests approved by Manager and pending HR approval
      return leaveRepo.find({
        where: {
          manager_approval: APPROVAL.Approved,
          HR_approval: APPROVAL.Pending,
        },
        relations: ['employee', 'leaveType'],
        order: { raisedDate: 'DESC' },
      });
    } else if (role === 'Director') {
      // Director views leave requests approved by Manager and HR, pending Director approval
      const directReports = await employeeRepo.find({
        where: { director: { id: currentUser.id } },
      });

      const managerIds = directReports
        .filter((e) => e.role === 'Manager')
        .map((m) => m.id);

      const employeeReports = await employeeRepo.find({
        where: { manager: { id: In(managerIds) } },
      });

      const allRelevantIds = [
        ...directReports.map((e) => e.id),
        ...employeeReports.map((e) => e.id),
      ];

      return leaveRepo.find({
        where: {
          employee: { id: In(allRelevantIds) },
          manager_approval: APPROVAL.Approved,
          HR_approval: APPROVAL.Approved,
          director_approval: APPROVAL.Pending,
        },
        relations: ['employee', 'leaveType'],
        order: { raisedDate: 'DESC' },
      });
    } else if (role === 'Employee') {
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
  static async updateLeaveRequest(id: string, updateData: Partial<LeaveRequest>) {
    const repo = dataSource.getRepository(LeaveRequest);
    const request = await repo.findOne({ where: { id }, relations: ['employee', 'leaveType'] });
    if (!request) throw new Error('Leave request not found');

    const wasPending = request.status === APPROVAL.Pending;
    const updated = repo.merge(request, updateData);

    const { manager_approval, HR_approval, director_approval } = updated;

    // Handle Rejected and Approved statuses
    if ([manager_approval, HR_approval, director_approval].includes(APPROVAL.Rejected)) {
      updated.status = APPROVAL.Rejected;
    } else if (
      manager_approval === APPROVAL.Approved &&
      HR_approval === APPROVAL.Approved &&
      director_approval === APPROVAL.Approved
    ) {
      const days = differenceInCalendarDays(new Date(request.endDate), new Date(request.startDate)) + 1;

      const balance = await LeaveBalanceController.patchLeaveBalance(
        updated.employee.id,
        updated.leaveType.id,
        days
      );

      if (balance < days) throw new Error('Insufficient leave balance');

      updated.status = APPROVAL.Approved;
    } else {
      updated.status = APPROVAL.Pending;
    }

    return await repo.save(updated);
  }

  // Delete a leave request by its ID
  static async deleteLeaveRequest(id: string) {
    const repo = dataSource.getRepository(LeaveRequest);
    const result = await repo.delete(id);
    return result.affected !== 0;
  }
}
