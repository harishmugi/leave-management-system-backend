"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveRequestValidator = void 0;
exports.isValidDate = isValidDate;
const userServices_1 = require("../userModule/userServices");
class LeaveRequestValidator {
    static async checkUserExist(employee_id) {
        const employee = await userServices_1.UserService.getEmployee(employee_id);
        if (!employee) {
            throw new Error('User does not exist');
        }
    }
}
exports.LeaveRequestValidator = LeaveRequestValidator;
// utils/dateValidator.ts
// Function to validate if a date is valid
function isValidDate(date) {
    const parsedDate = new Date(date);
    return parsedDate instanceof Date && !isNaN(parsedDate.getTime());
}
