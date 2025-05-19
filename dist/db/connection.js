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
exports.dataSource = void 0;
const typeorm_1 = require("typeorm");
const userEntity_1 = require("../src/userModule/userEntity");
const leaveRequestEntity_1 = require("../src/leaveRequestModule/leaveRequestEntity");
const leaveTypeEntity_1 = require("../src/leaveTypeModule/leaveTypeEntity");
const leaveBalanceEntity_1 = require("../src/leaveBalanceModule/leaveBalanceEntity");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const isSSL = process.env.SSL;
console.log("db user name", process.env.DB_USER);
const dataSource = new typeorm_1.DataSource({
    type: "mysql",
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5000'),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [userEntity_1.Employee, leaveRequestEntity_1.LeaveRequest, leaveTypeEntity_1.LeaveType, leaveBalanceEntity_1.LeaveBalance],
    synchronize: true,
    ssl: isSSL ? { rejectUnauthorized: false } : undefined,
});
exports.dataSource = dataSource;
dataSource.initialize().then(() => {
    console.log("databasde run aaguthu !");
}).catch((err) => {
    console.log("erroe adikkuthu : " + err);
});
