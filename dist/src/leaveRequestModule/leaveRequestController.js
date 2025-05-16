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
exports.LeaveRequestRoute = exports.LeaveRequestController = void 0;
const Jwt = __importStar(require("jsonwebtoken"));
const Joi = require("joi");
const leaveRequestServices_1 = require("./leaveRequestServices");
class LeaveRequestController {
    static async getDecodedToken(request) {
        const token = request.state.auth_token;
        if (!token)
            throw new Error('No token provided');
        try {
            return Jwt.verify(token, process.env.JWT_SECRET);
        }
        catch (err) {
            console.error('JWT verification failed:', err);
            throw new Error('Unauthorized');
        }
    }
    static async createLeaveRequest(request, h) {
        try {
            const decoded = await LeaveRequestController.getDecodedToken(request);
            const leaveData = request.payload;
            leaveData['employee_id'] = decoded.userData.id;
            const leaveRequest = await leaveRequestServices_1.LeaveRequestService.createLeaveRequest(leaveData);
            return h.response({ message: 'Leave request created', leaveRequest }).code(201);
        }
        catch (error) {
            console.error('Error creating leave request:', error);
            return h.response({ error: 'Failed to create leave request' }).code(error.message === 'Unauthorized' ? 401 : 500);
        }
    }
    static async getLeaveRequestsByRole(request, h) {
        try {
            const decoded = await LeaveRequestController.getDecodedToken(request);
            const leaveRequests = await leaveRequestServices_1.LeaveRequestService.getLeaveRequestsForRole(decoded.userData.id);
            return h.response(leaveRequests).code(200);
        }
        catch (error) {
            console.error('Error fetching leave requests by role:', error);
            return h.response({ error: 'Failed to fetch leave requests' }).code(error.message === 'Unauthorized' ? 401 : 500);
        }
    }
    static async getLeaveRequestByEmployee(request, h) {
        try {
            const decoded = await LeaveRequestController.getDecodedToken(request);
            const leaveRequests = await leaveRequestServices_1.LeaveRequestService.getLeaveRequestsForRole(decoded.userData.id);
            return h.response(leaveRequests).code(200);
        }
        catch (error) {
            console.error('Error fetching employee leave requests:', error);
            return h.response({ error: 'Failed to fetch employee leave requests' }).code(error.message === 'Unauthorized' ? 401 : 500);
        }
    }
    static async updateLeaveRequest(request, h) {
        try {
            const leaveId = request.params.id;
            const { id, approved } = request.payload;
            console.log(id);
            if (!['Manager', 'Hr', 'Director'].includes(id)) {
                return h.response({ error: 'Invalid approver role' }).code(400);
            }
            const approval = approved ? 'Approved' : 'Rejected';
            const updateData = {};
            switch (id) {
                case 'Manager':
                    updateData.manager_approval = approval;
                    break;
                case 'Hr':
                    updateData.HR_approval = approval;
                    break;
                case 'Director':
                    updateData.director_approval = approval;
                    break;
            }
            const updatedLeave = await leaveRequestServices_1.LeaveRequestService.updateLeaveRequest(leaveId, updateData);
            return h.response(updatedLeave).code(200);
        }
        catch (error) {
            console.error('Error updating leave request:', error);
            return h.response({ error: 'Failed to update leave request' }).code(500);
        }
    }
    static async deleteLeaveRequest(request, h) {
        try {
            const id = request.params.id;
            const deleted = await leaveRequestServices_1.LeaveRequestService.deleteLeaveRequest(id);
            if (!deleted) {
                return h.response({ error: 'Leave request not found' }).code(404);
            }
            return h.response({ message: 'Leave request deleted' }).code(200);
        }
        catch (error) {
            console.error('Error deleting leave request:', error);
            return h.response({ error: 'Failed to delete leave request' }).code(500);
        }
    }
}
exports.LeaveRequestController = LeaveRequestController;
exports.LeaveRequestRoute = [
    {
        method: 'POST',
        path: '/leaveRequest',
        handler: LeaveRequestController.createLeaveRequest,
        options: {
            validate: {
                payload: Joi.object({
                    startDate: Joi.string().required(),
                    endDate: Joi.string().required(),
                    reason: Joi.string().required(),
                    leave_type_id: Joi.number().required(), // <-- updated
                }),
                failAction: (request, h, err) => {
                    console.error('Validation error:', err?.message);
                    throw err;
                },
            },
        },
    },
    {
        method: 'GET',
        path: '/leaveRequests/approver',
        handler: LeaveRequestController.getLeaveRequestsByRole,
    },
    {
        method: 'GET',
        path: '/leaveRequests',
        handler: LeaveRequestController.getLeaveRequestByEmployee,
    },
    {
        method: 'PATCH',
        path: '/leaveRequest/{id}',
        handler: LeaveRequestController.updateLeaveRequest,
        options: {
            validate: {
                payload: Joi.object({
                    id: Joi.string().valid('Manager', 'Hr', 'Director').required(),
                    approved: Joi.boolean().required(),
                }),
                failAction: (request, h, err) => {
                    console.error('Validation error:', err?.message);
                    throw err;
                },
            },
        },
    },
    {
        method: 'DELETE',
        path: '/leaveRequest/{id}',
        handler: LeaveRequestController.deleteLeaveRequest,
    },
];
