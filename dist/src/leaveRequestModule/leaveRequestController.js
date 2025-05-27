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
const Joi = __importStar(require("joi"));
const leaveRequestServices_1 = require("./leaveRequestServices");
class LeaveRequestController {
    static async getDecodedToken(request) {
        const token = request.state.token;
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
    // Create Leave Request (send to all HR, Director, and the employee's manager)
    static async createLeaveRequest(request, h) {
        try {
            const decoded = await LeaveRequestController.getDecodedToken(request);
            const leaveData = request.payload;
            leaveData['employee_id'] = decoded.userData.id;
            // Create the leave request and notify HR, Directors, and manager
            const leaveRequest = await leaveRequestServices_1.LeaveRequestService.createLeaveRequest(leaveData);
            return h.response({ message: 'Leave request created', leaveRequest }).code(201);
        }
        catch (error) {
            console.error('Error creating leave request:', error);
            return h.response({ error: 'Failed to create leave request' }).code(error.message === 'Unauthorized' ? 401 : 500);
        }
    }
    // Get Leave Requests by Role (HR, Director)
    static async getLeaveRequestsByRole(request, h) {
        try {
            // Decode the JWT token or use whatever method to get the current user's data
            const decoded = await LeaveRequestController.getDecodedToken(request);
            // Get leave requests based on role
            const leaveRequests = await leaveRequestServices_1.LeaveRequestService.getLeaveRequestsForRole(decoded.userData.id);
            // Return the fetched leave requests
            return h.response(leaveRequests).code(200);
        }
        catch (error) {
            // Log and handle error based on the type
            console.error('Error fetching leave requests by role:', error);
            // Return a meaningful error message to the client
            return h.response({ error: 'Failed to fetch leave requests' }).code(error.message === 'Unauthorized' ? 401 : 500);
        }
    }
    static async getLeaveRequestForCalendar(request, h) {
        const { role } = request.params; // Access the 'role' path parameter
        try {
            const decoded = await LeaveRequestController.getDecodedToken(request);
            const userId = decoded.userData.id;
            let leaveRequests;
            // Fetch leave requests based on the role parameter
            if (role === 'Manager') {
                leaveRequests = await leaveRequestServices_1.LeaveRequestService.getLeaveRequestsForCalendar(userId);
            }
            else if (role === 'HR' || role === 'Director') {
                leaveRequests = await leaveRequestServices_1.LeaveRequestService.getLeaveRequestAll();
            }
            return h.response(leaveRequests).code(200);
        }
        catch (error) {
            console.error('Error fetching leave requests:', error);
            return h.response({ error: 'Failed to fetch leave requests' }).code(error.message === 'Unauthorized' ? 401 : 500);
        }
    }
    // Get Leave Request by Employee
    static async getLeaveRequestByEmployee(request, h) {
        try {
            const decoded = await LeaveRequestController.getDecodedToken(request);
            const leaveRequests = await leaveRequestServices_1.LeaveRequestService.getLeaveRequest(decoded.userData.id);
            return h.response(leaveRequests).code(200);
        }
        catch (error) {
            console.error('Error fetching employee leave requests:', error);
            return h.response({ error: 'Failed to fetch employee leave requests' }).code(error.message === 'Unauthorized' ? 401 : 500);
        }
    }
    // Update Leave Request Approval
    static async updateLeaveRequest(request, h) {
        try {
            const decoded = await LeaveRequestController.getDecodedToken(request);
            const leaveId = request.params.id;
            const { id, approved } = request.payload;
            if (!['Manager', 'Hr', 'Director'].includes(id)) {
                return h.response({ error: 'Invalid approver role' }).code(400);
            }
            const approvalStatus = approved ? 'Approved' : 'Rejected';
            const updateData = {};
            switch (id) {
                case 'Manager':
                    updateData.manager_approval = approvalStatus;
                    break;
                case 'Hr':
                    updateData.HR_approval = approvalStatus;
                    break;
                case 'Director':
                    updateData.director_approval = approvalStatus;
                    break;
            }
            const updatedLeave = await leaveRequestServices_1.LeaveRequestService.updateLeaveRequest(leaveId, updateData);
            if (!updatedLeave) {
                return h.response({ error: 'Leave request not found or unable to update' }).code(404);
            }
            return h.response(updatedLeave).code(200);
        }
        catch (error) {
            console.error('Error updating leave request:', error);
            return h.response({ error: 'Failed to update leave request' }).code(error.message === 'Unauthorized' ? 401 : 500);
        }
    }
    // Delete Leave Request
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
                    leave_type_id: Joi.number().required(),
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
        method: 'GET',
        path: '/leaveRequests/calendar/{role}',
        handler: LeaveRequestController.getLeaveRequestForCalendar,
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
