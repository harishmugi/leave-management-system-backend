"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserValidator = void 0;
const userServices_1 = require("./userServices");
class UserValidator {
    static async checkUserAlreadyExist(email) {
        const employee = await userServices_1.UserService.getEmployee(email);
        if (employee) {
            throw new Error('User with this email already exists');
        }
    }
    static async isUser(email) {
        const employee = await userServices_1.UserService.getEmployee(email);
        if (!employee) {
            throw new Error('User with this email already exists');
        }
    }
}
exports.UserValidator = UserValidator;
