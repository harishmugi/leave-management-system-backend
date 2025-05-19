import { Request, ResponseToolkit, ServerRoute } from '@hapi/hapi';
import { LeaveTypeService, LeaveTypeData } from './leaveTypeServices';
import { LeaveType } from './leaveTypeEntity';
import { LeaveTypeValidator } from './leaveTypeValidator';

export class LeaveTypeController {
  // CREATE LEAVE TYPE REQUEST
  static async createLeaveType(request: Request, h: ResponseToolkit) {
  const leaveTypeData = request.payload as { leave_type: string[] };  // Array of leave types
console.log("hittinng")
  try {
    // Validate if the leave type array is not empty
    if (!leaveTypeData.leave_type || leaveTypeData.leave_type.length === 0) {
      return h.response({ error: 'Leave type array cannot be empty' }).code(400);
    }

    // Validate if any leave types already exist in the database
    await LeaveTypeValidator.checkLeaveTypesAlreadyExist(leaveTypeData.leave_type);
    
    // Map the string array to an array of LeaveTypeData objects
    const leaveTypeDataObjects: LeaveTypeData[] = leaveTypeData.leave_type.map(leave => ({
      leave_type: leave,
      id: 0, // Or any default value for `id` if it's auto-generated in the database
    }));
    
    // Create leave types in bulk (single DB hit)
    const createdLeaveTypes = await LeaveTypeService.createLeaveTypesBulk(leaveTypeDataObjects);
    
    return h.response({ message: 'Leave types created successfully', leaveTypes: createdLeaveTypes }).code(201);
  } catch (error) {
    if (error.message.includes('already exists')) {
      return h.response({ error: error.message }).code(400); 
    }

    console.error('Error:', error);
    return h.response({ error: error.message || 'Failed to create leave types' }).code(500);
  }
}


  // GET LEAVE TYPES
  static async getLeaveType(request: Request, h: ResponseToolkit) {
    try {
      const leaveTypes = await LeaveTypeService.getAllLeaveType();
      return h.response(leaveTypes).code(200);
    } catch (error) {
      console.error('Error fetching leaveTypes:', error);
      return h.response({ error: 'Failed to fetch leaveTypes' }).code(500);
    }
  }

  // UPDATE LEAVE TYPE
  static async updateLeaveType(request: Request, h: ResponseToolkit) {
    const id = request.params.id;
    const updateData = request.payload as Partial<LeaveType>;

    try {
      const updatedLeaveType = await LeaveTypeService.updateLeaveType(id, updateData);

      if (!updatedLeaveType) {
        return h.response({ error: 'Leave type not found' }).code(404);
      }

      return h.response({ message: 'Leave type updated', leaveType: updatedLeaveType }).code(200);
    } catch (error) {
      console.error('Error updating leave type:', error);
      return h.response({ error: 'Failed to update leave type' }).code(500);
    }
  }

  // DELETE LEAVE TYPE
  static async deleteLeaveType(request: Request, h: ResponseToolkit) {
    const id = request.params.id;

    try {
      const deleted = await LeaveTypeService.deleteLeaveType(id);

      if (!deleted) {
        return h.response({ error: 'Leave type not found' }).code(404);
      }

      return h.response({ message: 'Leave type deleted successfully' }).code(200);
    } catch (error) {
      console.error('Error deleting leave type:', error);
      return h.response({ error: 'Failed to delete leave type' }).code(500);
    }
  }
}

// ROUTES
export const LeaveTypeRoute: ServerRoute[] = [
  {
    method: 'POST',
    path: '/leaveType',
    handler: LeaveTypeController.createLeaveType,
  },

  {
    method: 'GET',
    path: '/leaveTypes',
    handler: LeaveTypeController.getLeaveType,
  },

  {
    method: 'PUT',
    path: '/leaveType/{id}',
    handler: LeaveTypeController.updateLeaveType,
  },

  {
    method: 'DELETE',
    path: '/leaveType/{id}',
    handler: LeaveTypeController.deleteLeaveType,
  }
];
