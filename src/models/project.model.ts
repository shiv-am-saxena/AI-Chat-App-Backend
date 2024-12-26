import mongoose, { Schema, Document, ObjectId } from 'mongoose';

// Define an interface for the User subdocument
interface UserRef {
	userId: ObjectId;
	userName: string;
	email: string;
}

// Define an interface for the Project document
export interface IProject extends Document {
	projectName: string;
	users: UserRef[];
}

// Define the Project schema
const projectSchema = new Schema<IProject>({
	projectName: {
		type: String,
		required: true,
		trim: true,
		unique: [true, 'Project name must be unique']
	},
	users: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User'
		}
	]
});

// Export the Project model
export const Project = mongoose.model<IProject>('Project', projectSchema);
