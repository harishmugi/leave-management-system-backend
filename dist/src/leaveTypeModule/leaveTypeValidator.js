"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveTypeValidator = void 0;
const leaveTypeServices_1 = require("./leaveTypeServices");
class LeaveTypeValidator {
    static async checkLeaveTypeAlreadyExist(leave_type) {
        const type = await leaveTypeServices_1.LeaveTypeService.getLeaveType(leave_type);
        if (type) {
            throw new Error('Leave type already exists');
        }
    }
}
exports.LeaveTypeValidator = LeaveTypeValidator;
