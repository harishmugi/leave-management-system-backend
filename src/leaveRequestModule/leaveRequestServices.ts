import { dataSource } from '../../db/connection';
import { LeaveRequest } from './leaveRequestEntity';
import { Employee } from '../userModule/userEntity';
import { LeaveType } from '../leaveTypeModule/leaveTypeEntity';
import { differenceInCalendarDays } from 'date-fns';
import { LeaveBalanceController } from '../leaveBalanceModule/leaveBalanceController';
import { In, LessThanOrEqual, MoreThanOrEqual, Not } from 'typeorm';
import { isValidDate } from './leaveRequestValidation';
import { LeaveBalance } from '../leaveBalanceModule/leaveBalanceEntity';
import { error } from 'console';

// Define the possible leave request statuses
const APPROVAL = {
  Pending: 'Pending' as const,
  Approved: 'Approved' as const,
  Rejected: 'Rejected' as const,
  Cancelled: 'Cancelled' as const,
  NoManager: 'NotRequired' as const,

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
      const leaveType = await leaveTypeRepository.findOne({
        where: {
          id: leaveRequestData.leave_type_id
        },
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
          employee: { id: leaveRequestData.employee_id, soft_delete: false },
          startDate: LessThanOrEqual(endDate),
          endDate: MoreThanOrEqual(startDate),
          status: Not(In([APPROVAL.Rejected, APPROVAL.Cancelled])),
        },
      });

      if (overlap) throw new Error('Leave request overlaps with an existing one');

      const days = differenceInCalendarDays(endDate, startDate) + 1;
      const employee = await userRepository.findOne({
        where: { id: leaveRequestData.employee_id, soft_delete: false },
        relations: ['manager'],
      });

      const leaveBalanceRepo = dataSource.getRepository(LeaveBalance);
      const available = await leaveBalanceRepo.find({
        where: {
          employee_id: leaveRequestData.employee_id,
          leave_type_id: leaveRequestData.leave_type_id,
        }

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
          } else {
            leaveRequestData.manager_approval = APPROVAL.Pending;
          }
        } else {
          leaveRequestData.manager_approval = APPROVAL.NoManager;
        }
      } else if (days > 2 && days < 5) {
        if (manager) {
          if (managerRole === 'HR') {
            leaveRequestData.manager_approval = APPROVAL.NoManager;
            leaveRequestData.HR_approval = APPROVAL.Pending;
          } else {
            leaveRequestData.manager_approval = APPROVAL.Pending;
            leaveRequestData.HR_approval = APPROVAL.Pending;
          }
        } else {
          leaveRequestData.manager_approval = APPROVAL.NoManager;
          leaveRequestData.HR_approval = APPROVAL.Pending;
        }
      } else if (days >= 5) {
        if (managerRole === 'Director') {
          leaveRequestData.manager_approval = APPROVAL.NoManager;
          leaveRequestData.HR_approval = APPROVAL.Pending;
          leaveRequestData.director_approval = APPROVAL.Pending;
        } else if (managerRole === 'HR') {
          leaveRequestData.manager_approval = APPROVAL.NoManager;
          leaveRequestData.HR_approval = APPROVAL.Pending;
          leaveRequestData.director_approval = APPROVAL.Pending;
        } else {
          leaveRequestData.manager_approval = APPROVAL.Pending;
          leaveRequestData.HR_approval = APPROVAL.Pending;
          leaveRequestData.director_approval = APPROVAL.Pending;
        }
      }

      leaveRequestData.status = APPROVAL.Pending;
      leaveRequestData.raisedDate = new Date();

      // Handle specific leave types like Sick Leave
      if (leaveType.leave_type === 'Sick Leave') {
        const balance = await LeaveBalanceController.patchLeaveBalance(
          leaveRequestData.employee_id,
          leaveType.id,
          days
        );

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

    } catch (error: any) {
      throw new Error('Failed to create leave request: ' + error.message);
    }
  }


  // Notify the relevant approvers (Manager, HR, Directors)
  static async notifyApprovers(employee: Employee, days: number) {
    const approvers: Employee[] = [];

    try {
      // Get the manager of the employee (if any)
      if (employee.manager) {
        const manager = await dataSource.getRepository(Employee).findOne({
          where: { id: employee.manager.id, soft_delete: false },
        });
        if (manager) approvers.push(manager);
      }

      // Get all HR users
      const hrUsers = await dataSource.getRepository(Employee).find({
        where: { role: 'HR' },
      });

      // Get all Directors
      const directors = await dataSource.getRepository(Employee).find({
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
    } catch (error: any) {
      console.error('Error notifying approvers:', error.message);
    }
  }

  // Get all leave requests for a specific employee
  static async getLeaveRequest(employeeId: string) {
    const repo = dataSource.getRepository(LeaveRequest);
    return repo.find({
      where: { employee: { id: employeeId, soft_delete: false } },
      relations: ['employee', 'leaveType'],
      order: { raisedDate: 'DESC' },
    });
  }
  static async getLeaveRequestAll() {
    const repo = dataSource.getRepository(LeaveRequest);

    // Fetch all leave requests, regardless of employee or manager
    return repo.find({
      where: {
        employee: {
          soft_delete: false
        }
      },
      relations: ['employee', 'leaveType'], // Include relations with employee and leaveType
      order: { raisedDate: 'DESC' }, // Order by raisedDate in descending order
    });
  }

  static async getLeaveRequestsForCalendar(managerId: string) {
    const requestRepo = dataSource.getRepository(LeaveRequest);
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
      (manager_approval === APPROVAL.Approved || manager_approval === APPROVAL.NoManager) && (HR_approval === APPROVAL.Approved || HR_approval === APPROVAL.NoManager) && (director_approval === APPROVAL.Approved || director_approval === APPROVAL.NoManager)) {
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
  static async getLeaveRequestsForRole(userId: string) {
    const repo = dataSource.getRepository(LeaveRequest);
    const userRepo = dataSource.getRepository(Employee);

    // Get the logged-in user
    const user = await userRepo.findOne({
      where: { id: userId },
      relations: ['manager'],
    });

    if (!user) throw new Error('User not found');

    let leaveRequests: LeaveRequest[] = [];

    if (user.role === 'HR') {
      // Fetch all leave requests where HR approval is pending
      const allHrRequests = await repo.find({
        where: {
          HR_approval: 'Pending', employee: {
            soft_delete: false
          }
        },
        relations: ['employee', 'employee.manager', 'leaveType'],
        order: { raisedDate: 'DESC' },
      });

      // Show requests where:
      // 1. HR approval is required AND
      // 2. HR is assigned as the manager OR user is HR by role
      leaveRequests = allHrRequests.filter(req =>
        req.employee.manager?.id === user.id || user.role === 'HR'
      );
    } else if (user.role === 'Director') {
      // Show director approvals
      leaveRequests = await repo.find({
        where: { director_approval: 'Pending' },
        relations: ['employee', 'employee.manager', 'leaveType'],
        order: { raisedDate: 'DESC' },
      });
    } else if (user.role === 'Manager') {
      // Show requests from managed employees
      leaveRequests = await repo.find({
        where: {
          employee: { manager: { id: user.id } },
        },
        relations: ['employee', 'leaveType'],
        order: { raisedDate: 'DESC' },
      });
    } else {
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
