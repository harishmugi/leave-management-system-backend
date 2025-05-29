import { dataSource } from '../../db/connection';
import { LeaveBalance } from './leaveBalanceEntity';
import { LeaveType } from '../leaveTypeModule/leaveTypeEntity';

export interface LeaveBalanceData {
  id: string;
  employee_id: string;
  leave_type_id: number;
  allocated_leave: number;
  used_leave: number;
  remaining_leave: number;
}
// Define leave allocations for roles and leave types
const leaveAllocation: Record<string, Record<string, number>> = {
  Director: {
    "Casual Leave": 15,
    "Compensatory Off": 10,
    "Earned Leave": 30,
    "Maternity/Paternity Leave": 180,
    "Sick Leave": 15,
    "Unpaid Leave": 9999, // representing unlimited
  },
  HR: {
    "Casual Leave": 12,
    "Compensatory Off": 8,
    "Earned Leave": 25,
    "Maternity/Paternity Leave": 180,
    "Sick Leave": 12,
    "Unpaid Leave": 9999,
  },
  Manager: {
    "Casual Leave": 10,
    "Compensatory Off": 5,
    "Earned Leave": 20,
    "Maternity/Paternity Leave": 180,
    "Sick Leave": 10,
    "Unpaid Leave": 9999,
  },
  Employee: {
    "Casual Leave": 7,
    "Compensatory Off": 3,
    "Earned Leave": 15,
    "Maternity/Paternity Leave": 180,
    "Sick Leave": 7,
    "Unpaid Leave": 9999,
  },
  Intern: {
    "Casual Leave": 5,
    "Compensatory Off": 0,
    "Earned Leave": 5,
    "Maternity/Paternity Leave": 180,
    "Sick Leave": 5,
    "Unpaid Leave": 9999,
  }
};

export class LeaveBalanceService {

  // CREATE LEAVE BALANCE ========================================================================
  static async createLeaveBalance(leaveBalanceData: LeaveBalanceData): Promise<LeaveBalance> {
    const leaveBalanceRepository = dataSource.getRepository(LeaveBalance);
    console.log("Creating leave balance...");

    try {
      const leaveBalance = leaveBalanceRepository.create({ ...leaveBalanceData });
      await leaveBalanceRepository.save(leaveBalance);
      return leaveBalance;
    } catch (error) {
      console.error('Error creating leaveBalance:', error);
      throw new Error(`Failed to create leave balance for employee ${leaveBalanceData.employee_id}`);
    }
  }

  // GET ALL LEAVE BALANCES FOR AN EMPLOYEE =====================================================
  static async getAllLeaveBalance(id: string): Promise<LeaveBalance[]> {
    const leaveBalanceRepository = dataSource.getRepository(LeaveBalance);
    try {
      const leaveBalances = await leaveBalanceRepository.find({ where: { employee_id: id }, relations: ['leaveType'] });
      return leaveBalances;
    } catch (error) {
      console.error('Error fetching leave balances:', error);
      throw new Error('Failed to get leave balances');
    }
  }

  // UPDATE LEAVE BALANCE =====================================================================
  static async updateLeaveBalance(id: string, updateData: Partial<LeaveBalance>): Promise<LeaveBalance | null> {
    const leaveBalanceRepository = dataSource.getRepository(LeaveBalance);
    const leaveBalance = await leaveBalanceRepository.findOne({ where: { id } });

    if (!leaveBalance) {
      return null;
    }

    try {
      const updatedLeaveBalance = leaveBalanceRepository.merge(leaveBalance, updateData);
      return await leaveBalanceRepository.save(updatedLeaveBalance);
    } catch (error) {
      console.error('Error updating leave balance:', error);
      throw new Error(`Failed to update leave balance with id ${id}`);
    }
  }

  // DELETE LEAVE BALANCE =====================================================================
  static async deleteLeaveBalance(id: string): Promise<boolean> {
    const leaveBalanceRepository = dataSource.getRepository(LeaveBalance);
    try {
      const result = await leaveBalanceRepository.delete(id);
      return result.affected !== 0; // true if deletion occurred
    } catch (error) {
      console.error('Error deleting leave balance:', error);
      throw new Error(`Failed to delete leave balance with id ${id}`);
    }
  }

  static async initializeLeaveBalancesForEmployee(employeeId: string, role: string) {
    const leaveTypeRepo = dataSource.getRepository(LeaveType);
    const leaveBalanceRepo = dataSource.getRepository(LeaveBalance);

    try {
      const leaveTypes = await leaveTypeRepo.find();

      const leaveBalances = leaveTypes.map(type => {
        const balance = new LeaveBalance();
        balance.employee_id = employeeId;
        balance.leave_type_id = type.id;

        // Get allocated leave from allocation table, default to 0 if not found
        const allocated = leaveAllocation[role]?.[type.leave_type] ?? 0;

        balance.allocated_leave = allocated;
        balance.used_leave = 0;
        balance.remaining_leave = allocated;
        return balance;
      });

      await leaveBalanceRepo.save(leaveBalances);
    } catch (error) {
      console.error('Error initializing leave balances:', error);
      throw new Error(`Failed to initialize leave balances for employee ${employeeId}`);
    }
  }






  // Add this method to the LeaveBalanceService class
  static async getLeaveBalanceByEmployee(employeeId: string): Promise<LeaveBalance[]> {
    const leaveBalanceRepository = dataSource.getRepository(LeaveBalance);

    try {
      // Querying the database to get all leave balances for the specified employee
      const leaveBalances = await leaveBalanceRepository.find({
        where: { employee_id: employeeId },
        relations: ['leaveType'], // Assuming you want to also load the leaveType data
      });

      return leaveBalances;
    } catch (error) {
      console.error('Error fetching leave balances for employee:', error);
      throw new Error(`Failed to get leave balances for employee with ID ${employeeId}`);
    }
  }
}
