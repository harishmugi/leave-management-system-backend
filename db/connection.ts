import { DataSource } from "typeorm";
import { Employee } from "../src/userModule/userEntity";
import { LeaveRequest } from "../src/leaveRequestModule/leaveRequestEntity";
import {LeaveType} from '../src/leaveTypeModule/leaveTypeEntity'; 
import {LeaveBalance} from '../src/leaveBalanceModule/leaveBalanceEntity'
import * as dotenv from 'dotenv';
dotenv.config();

const isSSL = process.env.SSL;
console.log("db user name",process.env.DB_USER!)
const dataSource = new DataSource({
    type: "mysql",
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT||'5000'),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [Employee,LeaveRequest,LeaveType,LeaveBalance],
    synchronize:  true,
    ssl:isSSL ? {rejectUnauthorized : false} : undefined,
})




dataSource.initialize().then(() => {
    console.log("databasde run aaguthu !")
}).catch((err) => {
    console.log("erroe adikkuthu : " + err)
})


export { dataSource }