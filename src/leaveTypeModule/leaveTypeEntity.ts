import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany
} from "typeorm";
import { LeaveRequest } from "../leaveRequestModule/leaveRequestEntity";
import { LeaveBalance } from "../leaveBalanceModule/leaveBalanceEntity"; // Add correct path

@Entity()
export class LeaveType {
  static find(arg0: { where: { name: any; }; }) {
    throw new Error('Method not implemented.');
  }
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  leave_type: string;

  @OneToMany(() => LeaveRequest, leaveRequest => leaveRequest.leaveType)
  leaveRequests: LeaveRequest[];

  @OneToMany(() => LeaveBalance, leaveBalance => leaveBalance.leaveType)
  leaveBalances: LeaveBalance[];
}
