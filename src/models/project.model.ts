import mongoose, { Schema, Document, ObjectId } from 'mongoose';

// Define an interface for the User document
export interface IProject extends Document {
	projectName: string;
	users: ObjectId;
}

const projectSchema = new Schema<IProject>({
	projectName: {
		type: String,
		required: true,
		trim: true,
		unique: [true, 'Project name must be unique']
	},
	users: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'user'
	}
});

// Export the Project model
export const Project = mongoose.model<IProject>('Project', projectSchema);
