import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { LeaveType } from "../leaveTypeModule/leaveTypeEntity";
import { Employee } from "../userModule/userEntity";

// Approval status options
const APPROVAL = {
  Pending: 'Pending',
  Approved: 'Approved',
  Rejected: 'Rejected',
  Cancelled: 'Cancelled',
  NoManager: 'NotRequired',
} as const;

export type ApprovalStatus = typeof APPROVAL[keyof typeof APPROVAL];

@Entity()
export class LeaveRequest {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  employee_id: string;

  @ManyToOne(() => Employee, (employee) => employee.leaveRequests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: "employee_id" })
  employee: Employee;

  @Column({ nullable: true })
  leave_type_id: number | null;

  @ManyToOne(() => LeaveType, (leaveType) => leaveType.leaveRequests, {
    nullable: true,
  })
  @JoinColumn({ name: "leave_type_id" })
  leaveType: LeaveType | null;

  @Column()
  reason: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
    default: 'Pending',
  })
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

  @Column({
    type: 'enum',
    enum: ['Pending', 'Approved', 'Rejected', 'NotRequired'],
    default: 'Pending',
  })
  manager_approval: ApprovalStatus;

  @Column({
    type: 'enum',
    enum: ['Pending', 'Approved', 'Rejected', 'NotRequired'],
    default: 'Pending',
  })
  HR_approval: ApprovalStatus;

  @Column({
    type: 'enum',
    enum: ['Pending', 'Approved', 'Rejected', 'NotRequired'],
    default: 'Pending',
  })
  director_approval: ApprovalStatus;

  @CreateDateColumn()
  raisedDate: Date;

  @Column({
    type: 'enum',
    enum: ['manager', 'hr', 'director'],
    nullable: true,
  })
  approvalLevel: 'manager' | 'hr' | 'director' | null;
}
