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
exports.LeaveBalanceRoute = exports.LeaveBalanceController = void 0;
const leaveBalanceServices_1 = require("./leaveBalanceServices");
const leaveBalanceEntity_1 = require("./leaveBalanceEntity");
const Jwt = __importStar(require("jsonwebtoken"));
const userServices_1 = require("../userModule/userServices");
const connection_1 = require("../../db/connection");
class LeaveBalanceController {
    // CREATE LEAVE BALANCE
    static async createLeaveBalance(request, h) {
        console.log("hitted");
        const authHeader = request.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return h.response({ error: 'No token provided' }).code(401);
        }
        let decoded;
        try {
            decoded = Jwt.verify(token, process.env.JWT_SECRET);
        }
        catch (err) {
            return h.response({ error: 'Invalid token' }).code(401);
        }
        console.log('Decoded Email:', decoded.userData.email);
        const employee = await userServices_1.UserService.getEmployee(decoded.userData.email);
        if (!employee) {
            return h.response({ error: 'Employee not found' }).code(404);
        }
        const leaveBalanceData = request.payload;
        leaveBalanceData.employee_id = employee.id; // ✅ Set employee ID
        console.log("Leave Balance Payload:", leaveBalanceData);
        try {
            const leaveBalance = await leaveBalanceServices_1.LeaveBalanceService.createLeaveBalance(leaveBalanceData);
            return h.response({ message: 'Leave request created', leaveBalance }).code(201);
        }
        catch (error) {
            console.error('Error:', error);
            return h.response({ error: 'Failed to create leave request' }).code(500);
        }
    }
    //GET LEAVE REQUEST=======================================================================================================================================
    static async getLeaveBalance(request, h) {
        try {
            const token = request.state.auth_token;
            if (!token) {
                return h.response({ error: 'No token provided' }).code(401);
            }
            console.log("hitted balance");
            const decoded = Jwt.verify(token, process.env.JWT_SECRET);
            console.log('Decoded Email:', decoded.userData.id);
            const userId = decoded.userData.id;
            const employee = await userServices_1.UserService.getEmployee(decoded.userData.email);
            console.log("employeeeeee//", employee.id);
            if (employee) {
                const leaveBalances = await leaveBalanceServices_1.LeaveBalanceService.getAllLeaveBalance(userId);
                console.log(leaveBalances);
                return h.response(leaveBalances).code(200);
            }
        }
        catch (error) {
            console.error('Error fetching leaveBalances:', error);
            return h.response({ error: 'Failed to fetch leaveBalances' }).code(500);
        }
    }
    //UPDATE========================================================================================================================================
    static async updateLeaveBalance(request, h) {
        const id = request.params.id;
        const updateData = request.payload;
        try {
            const updatedLeaveBalance = await leaveBalanceServices_1.LeaveBalanceService.updateLeaveBalance(id, updateData);
            if (!updatedLeaveBalance) {
                return h.response({ error: 'Leave balance not found' }).code(404);
            }
            return h.response({ message: 'Leave balance updated', leaveBalance: updatedLeaveBalance }).code(200);
        }
        catch (error) {
            console.error('Error updating leave balance:', error);
            return h.response({ error: 'Failed to update leave balance' }).code(500);
        }
    }
    static async patchLeaveBalance(employeeId, leaveTypeId, daysTaken) {
        const balanceRepo = connection_1.dataSource.getRepository(leaveBalanceEntity_1.LeaveBalance);
        const balance = await balanceRepo.findOne({
            where: {
                employee_id: employeeId,
                leave_type_id: leaveTypeId,
            },
        });
        if (!balance) {
            throw new Error('Leave balance record not found');
        }
        console.log(daysTaken);
        balance.remaining_leave -= daysTaken;
        balance.used_leave = daysTaken;
        await balanceRepo.save(balance);
        console.log(`✅ Leave balance updated: -${daysTaken} days`);
        return balance.remaining_leave;
    }
    //DELETE========================================================================================================================================
    static async deleteLeaveBalance(request, h) {
        const id = request.params.id;
        try {
            const deleted = await leaveBalanceServices_1.LeaveBalanceService.deleteLeaveBalance(id);
            if (!deleted) {
                return h.response({ error: 'Leave balance not found' }).code(404);
            }
            return h.response({ message: 'Leave balance deleted successfully' }).code(200);
        }
        catch (error) {
            console.error('Error deleting leave balance:', error);
            return h.response({ error: 'Failed to delete leave balance' }).code(500);
        }
    }
}
exports.LeaveBalanceController = LeaveBalanceController;
//ROUTES==========================================================================================================================================
exports.LeaveBalanceRoute = [
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
    //crud
];
