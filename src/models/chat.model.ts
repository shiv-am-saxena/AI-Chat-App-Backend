import mongoose, { Schema, Document, ObjectId } from 'mongoose';

interface MsgRef {
	message: string;
	sender: string;
	email: string;
	sentAt: Date;
}

// Define an interface for the Chat document
export interface IChat extends Document {
	_id: ObjectId;
	pid: ObjectId;
	chats: MsgRef[];
}

// Define the Chat schema
const chatSchema = new Schema<IChat>({
	pid: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
		ref: 'Project',
		unique: true
	},
	chats: [
		{
			message: { type: String, required: true },
			sender: { type: String, required: true },
			email: { type: String, required: true },
			sentAt: { type: Date, default: Date.now },
		},
	],
});

// Export the Chat model
export const Chat = mongoose.model<IChat>('Chat', chatSchema);
