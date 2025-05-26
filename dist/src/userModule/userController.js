"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoute = exports.UserController = void 0;
const userServices_1 = require("./userServices");
const userValidator_1 = require("./userValidator");
const Jwt = __importStar(require("jsonwebtoken"));
const authMiddleware_1 = require("../middleWare/authMiddleware");
const exelParser_1 = require("../utils/exelParser");
class UserController {
    // CREATE EMPLOYEE
    static async createEmployee(request, h) {
        const userData = request.payload;
        try {
            await userValidator_1.UserValidator.checkUserAlreadyExist(userData.email);
            const token = await userServices_1.UserService.createEmployee(userData);
            return h.response({
                message: 'Employee created successfully',
                token,
            }).code(201);
        }
        catch (error) {
            console.error('Error:', error.message);
            return h.response({ error: error.message || 'Failed to create employee' }).code(400);
        }
    }
    // LOGIN
    static async login_handler(req, h) {
        const userData = req.payload;
        try {
            const token = await (0, authMiddleware_1.login)(userData.email, userData.password);
            const response = h.response({
                message: 'Login successful',
                token: token.token,
                role: token.role,
            })
                .state('role', token.role, {
                isHttpOnly: false,
                isSecure: true,
                path: '/',
                ttl: 60 * 60 * 1000,
                isSameSite: 'None',
            })
                .state('token', token.token, {
                isHttpOnly: true,
                isSecure: true,
                // isSecure: process.env.NODE_ENV === 'production',
                path: '/',
                ttl: 60 * 60 * 1000,
                isSameSite: 'None',
            });
            return response.code(200);
        }
        catch (error) {
            console.error('Error:', error.message);
            return h.response({ error: error.message || 'Failed to login' }).code(401);
        }
    }
    // GET ALL EMPLOYEES
    static async getEmployees(request, h) {
        try {
            const employees = await userServices_1.UserService.getAllEmployees();
            return h.response(employees).code(200);
        }
        catch (error) {
            console.error('Error fetching employees:', error);
            return h.response({ error: 'Failed to fetch employees' }).code(500);
        }
    }
    // GET CURRENT EMPLOYEE BY TOKEN
    static async getEmployee(req, h) {
        try {
            const token = req.state.token;
            console.log(token);
            if (!token) {
                return h.response({ error: 'No token provided' }).code(401);
            }
            const decoded = Jwt.verify(token, process.env.JWT_SECRET);
            const employee = await userServices_1.UserService.getEmployee(decoded.email);
            if (!employee) {
                return h.response({ error: 'Employee not found' }).code(404);
            }
            return h.response({ message: 'Employee found', employee }).code(200);
        }
        catch (error) {
            console.error('Error fetching employee:', error);
            return h.response({ error: 'Failed to fetch employee' }).code(500);
        }
    }
    // UPDATE EMPLOYEE
    static async updateEmployee(request, h) {
        const id = request.params.id;
        const updateData = request.payload;
        try {
            const updatedEmployee = await userServices_1.UserService.updateEmployee(id, updateData);
            if (!updatedEmployee) {
                return h.response({ error: 'Employee not found' }).code(404);
            }
            return h.response({ message: 'Employee updated', employee: updatedEmployee }).code(200);
        }
        catch (error) {
            console.error('Error updating employee:', error);
            return h.response({ error: 'Failed to update employee' }).code(500);
        }
    }
    // DELETE EMPLOYEE
    static async deleteEmployee(request, h) {
        const id = request.params.id;
        try {
            const deleted = await userServices_1.UserService.deleteEmployee(id);
            if (!deleted) {
                return h.response({ error: 'Employee not found' }).code(404);
            }
            return h.response({ message: 'Employee deleted successfully' }).code(200);
        }
        catch (error) {
            console.error('Error deleting employee:', error);
            return h.response({ error: 'Failed to delete employee' }).code(500);
        }
    }
    // GET CURRENT LOGGED-IN USER
    static async getCurrentUser(req, h) {
        try {
            const token = req.state.token;
            if (!token)
                return h.response({ error: 'No token' }).code(401);
            const decoded = Jwt.verify(token, process.env.JWT_SECRET);
            const user = await userServices_1.UserService.getEmployee(decoded.email);
            return h.response({ user }).code(200);
        }
        catch (err) {
            return h.response({ error: 'Invalid token' }).code(401);
        }
    }
    // SOFT DELETE EMPLOYEE
    static async softDeleteEmployee(req, h) {
        try {
            const userId = req.params.id;
            if (!userId) {
                return h.response({ error: 'Employee ID is required' }).code(400);
            }
            const deleted = await userServices_1.UserService.softDeleteEmployee(userId);
            return h.response({ message: 'Employee soft-deleted successfully' }).code(200);
        }
        catch (err) {
            console.error('Soft delete error:', err);
            return h.response({ error: 'Internal server error' }).code(500);
        }
    }
    static async deletedEmployees(req, h) {
        try {
            const deleted = await userServices_1.UserService.deletedEmployees();
            return h.response(deleted).code(200);
        }
        catch (err) {
            console.error('Soft delete error:', err);
            return h.response({ error: 'Internal server error' }).code(500);
        }
    }
    // BULK UPLOAD EMPLOYEES
    static async uploadHandler(req, h) {
        try {
            const file = req.payload.file;
            if (!file || !file._data) {
                return h.response({ error: 'No file uploaded' }).code(400);
            }
            const employees = await (0, exelParser_1.parseExcel)(file._data);
            console.log(`📊 Parsed ${employees.length} employees from Excel`);
            if (!employees || employees.length === 0) {
                return h.response({ error: 'No valid employees found in file' }).code(400);
            }
            await employeeQueue_1.employeeQueue.add('bulk-create', employees, {
                attempts: 3,
                backoff: { type: 'exponential', delay: 5000 },
            });
            return h.response({ message: 'Employees processing started' }).code(202);
        }
        catch (error) {
            console.error('❌ Upload error:', error);
            return h.response({ error: 'Failed to process file' }).code(500);
        }
    }
}
exports.UserController = UserController;
const employeeQueue_1 = require("../dist/employeeQueue");
exports.userRoute = [
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
    }, {
        method: 'GET',
        path: '/employee/restore',
        handler: UserController.deletedEmployees,
    },
    {
        method: 'PUT',
        path: '/employees/{id}',
        handler: UserController.updateEmployee,
    },
    {
        method: 'PATCH',
        path: '/employee/{id}',
        handler: UserController.softDeleteEmployee,
    },
    {
        method: 'DELETE',
        path: '/employees/{id}',
        handler: UserController.deleteEmployee,
    },
    {
        method: 'GET',
        path: '/me',
        handler: UserController.getCurrentUser,
    },
    {
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
        handler: UserController.uploadHandler,
    },
];
