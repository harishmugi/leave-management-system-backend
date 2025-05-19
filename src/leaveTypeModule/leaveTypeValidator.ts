import { LeaveTypeService } from './leaveTypeServices';

export class LeaveTypeValidator {

  // Check if any of the leave types already exist
  static async checkLeaveTypesAlreadyExist(leave_types: string[]) {
    const existingLeaveTypes = await LeaveTypeService.getLeaveTypesByNames(leave_types);

    if (existingLeaveTypes.length > 0) {
      const existingTypes = existingLeaveTypes.join(', ');
      throw new Error(`Leave types already exist: ${existingTypes}`);
    } return
  }
}
