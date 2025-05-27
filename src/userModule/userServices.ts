import { dataSource } from '../../db/connection';
import { Employee } from './userEntity';
import { generateJwt } from '../utils/jwt';
import { LeaveBalanceService } from '../leaveBalanceModule/leaveBalanceServices';

export interface EmployeeData {
  email: string;
  fullname: string;
  password: string;
  role: 'Employee' | 'Manager' | 'HR' | 'Director';
  managerEmail?: string;
  created_at: string;
  updated_at: string;
}

export class UserService {
  static async createEmployee(employeeData: EmployeeData) {
    const employeeRepository = dataSource.getRepository(Employee);

    try {
      const managerRepo = dataSource.getRepository(Employee);

      // Resolve manager
      let manager: Employee | null = null;
      if (employeeData.managerEmail) {
        manager = await managerRepo.findOneBy({ email: employeeData.managerEmail });
        if (!manager) throw new Error('Manager with the provided email does not exist.');
      }
   if (employeeData.email) {
        manager = await managerRepo.findOneBy({ email: employeeData.email });
        if (!manager) throw new Error('User with this email already exist.');
      }

      // Create employee with manager relationship only
      const employee = employeeRepository.create({
        fullname: employeeData.fullname,
        email: employeeData.email,
        password: employeeData.password,
        role: employeeData.role,
        manager: manager || null,
        created_at: new Date(employeeData.created_at),
        updated_at: new Date(employeeData.updated_at),
      });

      // Save to DB
      await employeeRepository.save(employee);

      // Initialize leave balances
      await LeaveBalanceService.initializeLeaveBalancesForEmployee(employee.id,employee.role);

      // Generate and return JWT
      return generateJwt(employee);

    } catch (error: any) {
      console.error('Error creating employee:', error);
      throw new Error(error.message || 'Failed to create employee!');
    }
  }

  static async getAllEmployees(): Promise<Employee[]> {
    try {
      const employeeRepository = dataSource.getRepository(Employee);
      return await employeeRepository.find({
        where:{soft_delete:false},
        relations: ['manager'],
      });
    } catch (error) {
      console.error('Error getting employees:', error);
      throw new Error('Failed to get employees!');
    }
  }

  static async getEmployee(id: string): Promise<Employee | null> {
    try {
      const employeeRepository = dataSource.getRepository(Employee);
      return await employeeRepository.findOne({
        where: { id,soft_delete:false },
        relations: ['manager'],
      });
    } catch (error) {
      console.error('Error getting employee:', error);
      throw new Error('Failed to get employee!');
    }
  }

  static async updateEmployee(id: string, updateData: Partial<Employee>): Promise<Employee | null> {
    const employeeRepository = dataSource.getRepository(Employee);
    const employee = await employeeRepository.findOneBy({ id });
    if (!employee) return null;

    try {
      const updated = employeeRepository.merge(employee, updateData);
      return await employeeRepository.save(updated);
    } catch (error) {
      console.error('Error updating employee:', error);
      throw new Error('Failed to update employee!');
    }
  }

  static async deleteEmployee(id: string): Promise<boolean> {
    const employeeRepository = dataSource.getRepository(Employee);
    try {
      const result = await employeeRepository.delete(id);
      return result.affected !== 0;
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw new Error('Failed to delete employee!');
    }
  }


static async softDeleteEmployee(id:string){


    const userRepo = dataSource.getRepository(Employee);
    const employee = await userRepo.findOne({ where: { id: id } });

    if (!employee) {
       throw new Error('Employee not found' );
    }

    employee.soft_delete =  !(employee.soft_delete);
    await userRepo.save(employee);

}
static async deletedEmployees(){


    const userRepo = dataSource.getRepository(Employee);
    const employees = await userRepo.find({ where: { soft_delete:true } });

    if (!employees) {
       throw new Error('Employee not found' );
    }
return employees
}

}
