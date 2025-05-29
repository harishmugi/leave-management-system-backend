import { Request, ResponseToolkit, ServerRoute } from '@hapi/hapi';
import { LeaveBalanceService, LeaveBalanceData } from './leaveBalanceServices';
import { LeaveBalance } from './leaveBalanceEntity';
import * as Jwt from 'jsonwebtoken';
import { UserService } from '../userModule/userServices';
import { dataSource } from '../../db/connection';

interface DecodedToken extends Jwt.JwtPayload {
  userData: { id: string, email: string }; // The token contains 'userData' property with 'id' and 'email'
}

export class LeaveBalanceController {

  // CREATE LEAVE BALANCE
  static async createLeaveBalance(request: Request, h: ResponseToolkit) {

    const token = request.state.token;

    if (!token) {
      return h.response({ error: 'No token provided' }).code(401);
    }

    let decoded: DecodedToken;
    try {
      decoded = Jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    } catch (err) {
      return h.response({ error: 'Invalid token' }).code(401);
    }


    const employee = await UserService.getEmployee(decoded.userData.id); // Use decoded.id
    if (!employee) {
      return h.response({ error: 'Employee not found' }).code(404);
    }

    const leaveBalanceData = request.payload as LeaveBalanceData;
    leaveBalanceData.employee_id = employee.id; // ✅ Set employee ID


    try {
      const leaveBalance = await LeaveBalanceService.createLeaveBalance(leaveBalanceData);
      return h.response({ message: 'Leave balance created', leaveBalance }).code(201);
    } catch (error) {
      console.error('Error:', error);
      return h.response({ error: 'Failed to create leave balance' }).code(500);
    }
  }

  // GET LEAVE BALANCE
  static async getLeaveBalance(request: Request, h: ResponseToolkit) {
    try {
      const token = request.state.token;
      if (!token) {
        return h.response({ error: 'No token provided' }).code(401);
      }
      const decoded = Jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
      const userId = decoded.userData.id;
      const employee = await UserService.getEmployee(userId); // Use userId directly
      if (!employee) {
        return h.response({ error: 'Employee not found' }).code(404);
      }

      // If employee is HR, Director, or Manager, they might have access to all balances
      let leaveBalances;
      if (employee.role === 'HR' || employee.role === 'Director') {
        leaveBalances = await LeaveBalanceService.getAllLeaveBalance(userId); // Retrieve all balances if role is HR or Director
      } else {
        leaveBalances = await LeaveBalanceService.getLeaveBalanceByEmployee(userId); // Fetch specific balance for the employee
      }

      return h.response(leaveBalances).code(200);
    } catch (error) {
      console.error('Error fetching leave balances:', error);
      return h.response({ error: 'Failed to fetch leave balances' }).code(500);
    }
  }

  // UPDATE LEAVE BALANCE
  static async updateLeaveBalance(request: Request, h: ResponseToolkit) {
    const id = request.params.id;
    const updateData = request.payload as Partial<LeaveBalance>;

    try {
      const updatedLeaveBalance = await LeaveBalanceService.updateLeaveBalance(id, updateData);

      if (!updatedLeaveBalance) {
        return h.response({ error: 'Leave balance not found' }).code(404);
      }

      return h.response({ message: 'Leave balance updated', leaveBalance: updatedLeaveBalance }).code(200);
    } catch (error) {
      console.error('Error updating leave balance:', error);
      return h.response({ error: 'Failed to update leave balance' }).code(500);
    }
  }
  static async patchLeaveBalance(employeeId: string, leaveTypeId: number, daysTaken: number) {
    const balanceRepo = dataSource.getRepository(LeaveBalance);
    const balance = await balanceRepo.findOne({
      where: {
        employee_id: employeeId,
        leave_type_id: leaveTypeId,
      },
    });

    if (!balance) throw new Error('Leave balance record not found');
    if (balance.remaining_leave < daysTaken) throw new Error('Insufficient leave balance');

    balance.remaining_leave -= daysTaken;
    balance.used_leave += daysTaken;

    await balanceRepo.save(balance);
    return balance.remaining_leave;
  }
  // DELETE LEAVE BALANCE
  static async deleteLeaveBalance(request: Request, h: ResponseToolkit) {
    const id = request.params.id;

    try {
      const deleted = await LeaveBalanceService.deleteLeaveBalance(id);

      if (!deleted) {
        return h.response({ error: 'Leave balance not found' }).code(404);
      }

      return h.response({ message: 'Leave balance deleted successfully' }).code(200);
    } catch (error) {
      console.error('Error deleting leave balance:', error);
      return h.response({ error: 'Failed to delete leave balance' }).code(500);
    }
  }
}

// ROUTES
export const LeaveBalanceRoute: ServerRoute[] = [
  {
    method: 'POST',
    path: '/leaveBalance',
    handler: LeaveBalanceController.createLeaveBalance
  },

  {
    method: 'GET',
    path: '/leaveBalance',
    handler: LeaveBalanceController.getLeaveBalance
  },

  {
    method: 'PUT',
    path: '/leaveBalance/{id}',
    handler: LeaveBalanceController.updateLeaveBalance,
  },
  {
    method: 'PATCH',
    path: '/leaveBalance',
    handler: LeaveBalanceController.patchLeaveBalance,
  },

  {
    method: 'DELETE',
    path: '/leaveBalance/{id}',
    handler: LeaveBalanceController.deleteLeaveBalance,
  }
];
