"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveTypeValidator = void 0;
const leaveTypeServices_1 = require("./leaveTypeServices");
class LeaveTypeValidator {
    // Check if any of the leave types already exist
    static async checkLeaveTypesAlreadyExist(leave_types) {
        const existingLeaveTypes = await leaveTypeServices_1.LeaveTypeService.getLeaveTypesByNames(leave_types);
        if (existingLeaveTypes.length > 0) {
            const existingTypes = existingLeaveTypes.join(', ');
            throw new Error(`Leave types already exist: ${existingTypes}`);
        }
        return;
    }
}
exports.LeaveTypeValidator = LeaveTypeValidator;
