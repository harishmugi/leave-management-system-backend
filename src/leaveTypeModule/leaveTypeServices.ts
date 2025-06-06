import { In } from 'typeorm';
import { dataSource } from '../../db/connection';  // Adjust this path based on your project structure
import { LeaveType } from './leaveTypeEntity';  // Assuming you have a LeaveType entity

// Define the structure for LeaveTypeData
export interface LeaveTypeData {
    id: number;
    leave_type: string;
}

export class LeaveTypeService {

    //CREATE LEAVE TYPE================================================================================================================================

    // Bulk create leave types
    static async createLeaveTypesBulk(leaveTypeData: LeaveTypeData[]): Promise<LeaveType[]> {
        const leaveTypeRepository = dataSource.getRepository(LeaveType);

        try {
            // Prepare an array of leaveType entities to be inserted
            const leaveTypes = leaveTypeData.map(data => leaveTypeRepository.create({ ...data }));

            // Save all leave types in bulk
            await leaveTypeRepository.save(leaveTypes);

            return leaveTypes;  // Return the created leave types
        } catch (error) {
            console.error('Error creating leave types in bulk:', error);
            throw new Error('Failed to create leave types!');
        }
    }

    //GET LEAVE TYPES==================================================================================================================================

    static async getAllLeaveType(): Promise<LeaveType[]> {
        try {
            const leaveTypeRepository = dataSource.getRepository(LeaveType);
            return await leaveTypeRepository.find();
        } catch (error) {
            console.error('Error in getting leave types!', error);
            throw new Error('Failed to get leave types!');
        }
    }

    // Get a specific leave type by name
    static async getLeaveType(leave_type: string): Promise<LeaveType | null> {
        try {
            const leaveTypeRepository = dataSource.getRepository(LeaveType);
            return await leaveTypeRepository.findOneBy({ leave_type }); // Pass as an object
        } catch (error) {
            console.error('Error in getting leave type!', error);
            throw new Error('Failed to get leave type!');
        }
    }

    // Method to check if any of the leave types already exist in the database
    static async getLeaveTypesByNames(leave_types: string[]): Promise<string[]> {
        try {
            const leaveTypeRepository = dataSource.getRepository(LeaveType);

            // Fetching existing leave types from the database
            const existingLeaveTypes = leaveTypeRepository.find({
                where: { leave_type: In(leave_types) } // Assuming 'leave_type' is the column where leave types are stored
            });

            // Returning only the names of the existing leave types
            return (await existingLeaveTypes).map((leaveType) => leaveType.leave_type);
        } catch (error) {
            console.error('Error fetching leave types:', error);
            return [];  // Return an empty array if there's an error
        }
    }

    //UPDATE LEAVE TYPE=================================================================================================================================

    static async updateLeaveType(id: number, updateData: Partial<LeaveType>): Promise<LeaveType | null> {
        const leaveTypeRepository = dataSource.getRepository(LeaveType);
        const leaveType = await leaveTypeRepository.findOneBy({ id });

        if (!leaveType) {
            return null; // Return null if leave type doesn't exist
        }

        try {
            // Merge the update data with the existing leave type
            const updated = leaveTypeRepository.merge(leaveType, updateData);
            return await leaveTypeRepository.save(updated); // Save the updated leave type
        } catch (error) {
            console.error('Error in updating leave type!', error);
            throw new Error('Failed to update leave type!');
        }
    }

    //DELETE LEAVE TYPE===============================================================================================================================

    static async deleteLeaveType(id: string): Promise<boolean> {
        const leaveTypeRepository = dataSource.getRepository(LeaveType);
        try {
            const result = await leaveTypeRepository.delete(id); // Delete by id
            return result.affected !== 0; // true if deletion occurred
        } catch (error) {
            console.error('Error in deletion!', error);
            throw new Error('Failed to delete leave type!');
        }
    }
}
