import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany
} from "typeorm";
import { LeaveRequest } from "../leaveRequestModule/leaveRequestEntity";
import { boolean } from "joi";

@Entity()
export class Employee {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  fullname: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: ['Employee', 'Manager', 'HR', 'Director'],
    default: 'Employee'
  })
  role: 'Employee' | 'Manager' | 'HR' | 'Director';

  // ✅ Manager relationship (self-referencing)
  @ManyToOne(() => Employee, employee => employee.subordinates, { nullable: true })
  @JoinColumn({ name: 'manager_id' })
  manager?: Employee;

  @OneToMany(() => Employee, employee => employee.manager)
  subordinates?: Employee[];

  @OneToMany(() => LeaveRequest, leaveRequest => leaveRequest.employee)
  leaveRequests: LeaveRequest[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
 @Column({default: false })
  soft_delete:boolean;

  // ✅ Virtual field for manager's email
  get managerEmail(): string | null {
    return this.manager?.email ?? null;
  }
}