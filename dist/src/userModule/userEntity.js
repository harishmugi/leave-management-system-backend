"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Employee = void 0;
const typeorm_1 = require("typeorm");
const leaveRequestEntity_1 = require("../leaveRequestModule/leaveRequestEntity");
let Employee = class Employee {
    // ✅ Virtual field for manager's email
    get managerEmail() {
        return this.manager?.email ?? null;
    }
};
exports.Employee = Employee;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Employee.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Employee.prototype, "fullname", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Employee.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Employee.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['Employee', 'Manager', 'HR', 'Director'],
        default: 'Employee'
    }),
    __metadata("design:type", String)
], Employee.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Employee, employee => employee.subordinates, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'manager_id' }),
    __metadata("design:type", Employee)
], Employee.prototype, "manager", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Employee, employee => employee.manager),
    __metadata("design:type", Array)
], Employee.prototype, "subordinates", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => leaveRequestEntity_1.LeaveRequest, leaveRequest => leaveRequest.employee),
    __metadata("design:type", Array)
], Employee.prototype, "leaveRequests", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Employee.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Employee.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Employee.prototype, "soft_delete", void 0);
exports.Employee = Employee = __decorate([
    (0, typeorm_1.Entity)()
], Employee);
