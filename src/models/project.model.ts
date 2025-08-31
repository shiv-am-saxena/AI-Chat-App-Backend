//project model
import mongoose, { Schema, Document, ObjectId } from 'mongoose';
import { Chat } from './chat.model.js';

// Define an interface for the User subdocument
interface UserRef {
	userId: ObjectId;
	userName: string;
	email: string;
}

// Define an interface for the Project document
export interface IProject extends Document {
	_id: ObjectId;
	projectName: string;
	description: string;
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
	description: {
		type: String,
		required: false,
		trim: true
	},
	users: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User'
		}
	]
});
// Use post middleware to create a chat after a project is saved
projectSchema.post('save', async function (doc) {
	await Chat.create({ pid: doc._id });
});

// Export the Project model
export const Project = mongoose.model<IProject>('Project', projectSchema);
