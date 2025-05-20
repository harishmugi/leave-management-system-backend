import { In, LessThanOrEqual, MoreThanOrEqual, Not } from 'typeorm';
import { dataSource } from '../../db/connection';
import { LeaveType } from '../leaveTypeModule/leaveTypeEntity';
import { Employee } from '../userModule/userEntity';
import { LeaveRequest } from './leaveRequestEntity';
import { LeaveBalance } from '../leaveBalanceModule/leaveBalanceEntity';
import { differenceInCalendarDays } from 'date-fns';
import { isValidDate } from './leaveRequestValidation';
import { LeaveBalanceController } from '../leaveBalanceModule/leaveBalanceController';

const APPROVAL = {
    Pending: 'Pending' as 'Pending',
    Approved: 'Approved' as 'Approved',
    Rejected: 'Rejected' as 'Rejected'
};
export class LeaveRequestService {
    static async createLeaveRequest(leaveRequestData: any) {
        const leaveRequestRepository = dataSource.getRepository(LeaveRequest);
        const leaveTypeRepository = dataSource.getRepository(LeaveType);
        const userRepository = dataSource.getRepository(Employee);

        console.log('Start Date:', leaveRequestData.startDate);
        console.log('End Date:', leaveRequestData.endDate);

        if (!isValidDate(leaveRequestData.startDate) || !isValidDate(leaveRequestData.endDate)) {
            console.error('Invalid date format');
            throw new Error('Invalid start or end date');
        }

        try {
            const leaveType = await leaveTypeRepository.findOne({ where: { id: leaveRequestData.leave_type_id } });
            if (!leaveType) throw new Error("Invalid leave type");

            const startDate = new Date(leaveRequestData.startDate);
            const endDate = new Date(leaveRequestData.endDate);

            if (startDate > endDate) {
                console.error('Start date cannot be after end date');
                throw new Error('Start date cannot be after end date');
            }

            const overlap = await leaveRequestRepository.findOne({
                where: {
                    employee: { id: leaveRequestData.employee_id },
                    startDate: LessThanOrEqual(endDate),
                    endDate: MoreThanOrEqual(startDate),
                    status: Not(In(['Rejected', 'Cancelled']))
                }
            });

            if (overlap) throw new Error('Leave request overlaps with an existing one');

            const days = differenceInCalendarDays(endDate, startDate) + 1;

            leaveRequestData.manager_approval = APPROVAL.Pending;
            leaveRequestData.HR_approval = APPROVAL.Pending;
            leaveRequestData.director_approval = APPROVAL.Pending;
            leaveRequestData.status = APPROVAL.Pending;
            leaveRequestData.raisedDate = new Date();

            // Auto-approve sick leave
            if (leaveType.leave_type === 'Sick Leave') {
                const balance = await LeaveBalanceController.patchLeaveBalance(
                    leaveRequestData.employee_id,
                    leaveType.id,
                    days
                );
                if (balance < days) throw new Error('Insufficient leave balance');

                leaveRequestData.manager_approval = APPROVAL.Approved;
                leaveRequestData.HR_approval = APPROVAL.Approved;
                leaveRequestData.director_approval = APPROVAL.Approved;
                leaveRequestData.status = APPROVAL.Approved;
            }

            const leaveRequest = leaveRequestRepository.create({ ...leaveRequestData });
            await leaveRequestRepository.save(leaveRequest);

            if (leaveType.leave_type !== 'Sick Leave') {
                const employee = await userRepository.findOne({ where: { id: leaveRequestData.employee_id } });
                if (employee) await this.notifyApprovers(employee, days);
            }

            return leaveRequest;
        } catch (error) {
            console.error('Error creating leave request:', error.message);
            throw new Error('Failed to create leave request: ' + error.message);
        }
    }

    static async notifyApprovers(employee: Employee, days: number) {
        const roles = ['manager'];
        if (days > 1) roles.push('HR');
        if (days > 5) roles.push('director');
        console.log(`Notify ${roles.join(', ')} for ${employee.fullname}`);
    }

    static async getAllLeaveRequest(employeeIds: string[]) {
        const repo = dataSource.getRepository(LeaveRequest);
        return repo.find({
            where: { employee: { id: In(employeeIds) }, status: APPROVAL.Pending },
            relations: ['employee', 'leaveType'],
            order: { raisedDate: 'DESC' }
        });
    }

    static async getLeaveRequest(employeeId: string) {
        const repo = dataSource.getRepository(LeaveRequest);
        return repo.find({
            where: { employee: { id: employeeId } },
            relations: ['employee', 'leaveType'],
            order: { raisedDate: 'DESC' }
        });
    }

    static async getLeaveRequestsForRole(roleId: string) {
        const employeeRepo = dataSource.getRepository(Employee);
        const leaveRepo = dataSource.getRepository(LeaveRequest);

        const roleEmployee = await employeeRepo.findOne({
            where: { id: roleId },
            relations: ['manager']
        });

        if (!roleEmployee) throw new Error('Approver not found');

        const role = roleEmployee.role;

        if (role === 'Manager') {
            const directReports = await employeeRepo.find({
                where: { manager: { id: roleEmployee.id } },
            });
            const employeeIds = directReports.map(e => e.id);
            if (employeeIds.length === 0) return [];
            return leaveRepo.find({
                where: {
                    employee: { id: In(employeeIds) },
                    manager_approval: APPROVAL.Pending
                },
                relations: ['employee', 'leaveType'],
                order: { raisedDate: 'DESC' }
            });

        } else if (role === 'HR') {
            const reports = await employeeRepo.find({
                where: { manager: { id: roleEmployee.id } },
            });
            const reportIds = reports.map(e => e.id);
            if (reportIds.length === 0) return [];
            return leaveRepo.find({
                where: {
                    employee: { id: In(reportIds) },
                    manager_approval: APPROVAL.Approved,
                    HR_approval: APPROVAL.Pending
                },
                relations: ['employee', 'leaveType'],
                order: { raisedDate: 'DESC' }
            });

        } else if (role === 'Director') {
            const managers = await employeeRepo.find({
                where: { manager: { id: roleEmployee.id }, role: 'Manager' }
            });
            const managerIds = managers.map(m => m.id);
            const indirectReports = await employeeRepo.find({
                where: { manager: { id: In(managerIds) } }
            });
            const employeeIds = [...managerIds, ...indirectReports.map(e => e.id)];
            if (employeeIds.length === 0) return [];

            return leaveRepo.find({
                where: {
                    employee: { id: In(employeeIds) },
                    manager_approval: APPROVAL.Approved,
                    HR_approval: APPROVAL.Approved,
                    director_approval: APPROVAL.Pending
                },
                relations: ['employee', 'leaveType'],
                order: { raisedDate: 'DESC' }
            });

        } else if (role === "Employee") {
            return leaveRepo.find({
                where: {
                    employee: { id: roleEmployee.id }
                },
                relations: ['employee', 'leaveType'],
                order: { raisedDate: 'DESC' }
            });

        } else {
            throw new Error('Invalid role');
        }
    }

    static async updateLeaveRequest(id: string, updateData: Partial<LeaveRequest>) {
        const repo = dataSource.getRepository(LeaveRequest);

        const request = await repo.findOne({ where: { id }, relations: ['employee', 'leaveType'] });
        if (!request) throw new Error('Leave request not found');

        const wasPending = request.status === APPROVAL.Pending;
        const updated = repo.merge(request, updateData);

        const { manager_approval, HR_approval, director_approval } = updated;

        if ([manager_approval, HR_approval, director_approval].includes(APPROVAL.Rejected)) {
            updated.status = APPROVAL.Rejected;
        } else if (
            manager_approval === APPROVAL.Approved &&
            HR_approval === APPROVAL.Approved &&
            director_approval === APPROVAL.Approved
        ) {
            // Check balance before approval
            const days = differenceInCalendarDays(
                new Date(request.endDate),
                new Date(request.startDate)
            ) + 1;

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

        const saved = await repo.save(updated);
        return saved;
    }

    static async deleteLeaveRequest(id: string) {
        const repo = dataSource.getRepository(LeaveRequest);
        const result = await repo.delete(id);
        return result.affected !== 0;
    }
}
