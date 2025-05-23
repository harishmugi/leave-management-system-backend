import { Request, ResponseToolkit, ServerRoute } from '@hapi/hapi';
import { UserService } from './userServices';
import { EmployeeData } from './userServices';
import { UserValidator } from './userValidator';
import * as Jwt from 'jsonwebtoken';
import { login } from '../middleWare/authMiddleware';



import { parseExcel } from '../utils/exelParser' ;
import { employeeQueue } from '../queue/employeeQueue';

interface DecodedToken extends Jwt.JwtPayload {
  email: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

export class UserController {
  // CREATE EMPLOYEE
  static async createEmployee(request: Request, h: ResponseToolkit) {
    const userData = request.payload as EmployeeData;
    try {
      await UserValidator.checkUserAlreadyExist(userData.email);
      const token = await UserService.createEmployee(userData);

      return h.response({
        message: 'Employee created successfully',
        token,
      }).code(201);
    } catch (error: any) {
      console.error('Error:', error.message);
      return h.response({ error: error.message || 'Failed to create employee' }).code(400);
    }
  }

  static async login_handler(req: Request, h: ResponseToolkit) {
    const userData = req.payload as LoginPayload;
    try {
      const token = await login(userData.email, userData.password);
  
      // Set the token and role in the response body, and in the cookies as well.
      const response = h.response({
        message: 'Login successful',
        token: token.token,  // Send token in the response body
        role: token.role,    // Send role in the response body
      })
      .state('role', token.role, {
        isHttpOnly: false,
        isSecure: process.env.NODE_ENV === 'production',
        path: '/',
        ttl: 60 * 60 * 1000, // 1 hour
        isSameSite: 'None',
      })
      .state('auth_token', token.token, {
        isHttpOnly: false,
        isSecure: process.env.NODE_ENV === 'production',
        path: '/',
        ttl: 60 * 60 * 1000, // 1 hour
        isSameSite: 'None',
      });
  
      return response.code(200);
    } catch (error: any) {
      console.error('Error:', error.message);
      return h.response({ error: error.message || 'Failed to login' }).code(401);
    }
  }
  

  // GET EMPLOYEES
  static async getEmployees(request: Request, h: ResponseToolkit) {
    try {
      const employees = await UserService.getAllEmployees();
      return h.response(employees).code(200);
    } catch (error) {
      console.error('Error fetching employees:', error);
      return h.response({ error: 'Failed to fetch employees' }).code(500);
    }
  }

  // GET EMPLOYEE
  static async getEmployee(req: Request, h: ResponseToolkit) {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (!token) {
        return h.response({ error: 'No token provided' }).code(401);
      }
      const decoded = Jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
      const employee = await UserService.getEmployee(decoded.email);

      if (!employee) {
        return h.response({ error: 'Employee not found' }).code(404);
      }

      return h.response({ message: 'Employee found', employee }).code(200);
    } catch (error) {
      console.error('Error fetching employee:', error);
      return h.response({ error: 'Failed to fetch employee' }).code(500);
    }
  }

  // UPDATE EMPLOYEE
  static async updateEmployee(request: Request, h: ResponseToolkit) {
    const id = request.params.id;
    const updateData = request.payload as Partial<Employee>;

    try {
      const updatedEmployee = await UserService.updateEmployee(id, updateData);

      if (!updatedEmployee) {
        return h.response({ error: 'Employee not found' }).code(404);
      }

      return h.response({ message: 'Employee updated', employee: updatedEmployee }).code(200);
    } catch (error) {
      console.error('Error updating employee:', error);
      return h.response({ error: 'Failed to update employee' }).code(500);
    }
  }

  // DELETE EMPLOYEE
  static async deleteEmployee(request: Request, h: ResponseToolkit) {
    const id = request.params.id;

    try {
      const deleted = await UserService.deleteEmployee(id);

      if (!deleted) {
        return h.response({ error: 'Employee not found' }).code(404);
      }

      return h.response({ message: 'Employee deleted successfully' }).code(200);
    } catch (error) {
      console.error('Error deleting employee:', error);
      return h.response({ error: 'Failed to delete employee' }).code(500);
    }
  }





  // UserController.ts
static async getCurrentUser(req: Request, h: ResponseToolkit) {
  try {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.split(' ')[1];
    if (!token) return h.response({ error: 'No token' }).code(401);

    const decoded = Jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    const user = await UserService.getEmployee(decoded.email);

    return h.response({ user }).code(200);
  } catch (err) {
    return h.response({ error: 'Invalid token' }).code(401);
  }
}


































}
import { Employee } from './userEntity';

export const userRoute: ServerRoute[] = [
  {
    method: 'POST',
    path: '/employees',
    handler: UserController.createEmployee,
  },
  {
    method: 'POST',
    path: '/login',
    handler: UserController.login_handler,
  },
  {
    method: 'GET',
    path: '/employees',
    handler: UserController.getEmployees,
  },
  {
    method: 'GET',
    path: '/employee',
    handler: UserController.getEmployee,
  },
  {
    method: 'PUT',
    path: '/employees/{id}',
    handler: UserController.updateEmployee,
  },
  {
    method: 'DELETE',
    path: '/employees/{id}',
    handler: UserController.deleteEmployee,
  },{
    method: 'GET',
    path: '/me',
    handler: UserController.getCurrentUser,
  }
  
];






export const uploadHandler = async (req: Request, h: ResponseToolkit) => {
  try {
    const file = (req.payload as any).file;

    if (!file || !file._data) {
      return h.response({ error: 'No file uploaded' }).code(400);
    }

    
    const employees = await parseExcel(file._data);
    console.log(`📊 Parsed ${employees.length} employees from Excel`);

    if (!employees || employees.length === 0) {
      return h.response({ error: 'No valid employees found in file' }).code(400);
    }

    await employeeQueue.add('bulk-create', employees, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });

    return h.response({ message: 'Employees processing started' }).code(202);
  } catch (error) {
    console.error('❌ Upload error:', error);
    return h.response({ error: 'Failed to process file' }).code(500);
  }
};

    
    
    
    
    
    
    
    export const uploadRoute: ServerRoute = {
      method: 'POST',
      path: '/employees/bulk-upload',
      options: {
        payload: {
          output: 'stream',
          parse: true,
          allow: 'multipart/form-data',
          maxBytes: 10 * 1024 * 1024, // 10MB
          multipart: true,
        },
      },
      handler: uploadHandler,
    };
    
    
