import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Define an interface for the User document
export interface IUser extends Document {
	fullName: string;
	email: string;
	password: string;
	isValidPassword(password: string): Promise<boolean>;
	genJWT(): string;
}

// Define an interface for the User model
export interface IUserModel extends Model<IUser> {
	hashPassword(password: string): Promise<string>;
}

const userSchema = new Schema<IUser>({
	fullName: {
		type: String,
		required: true,
		trim: true
	},
	email: {
		type: String,
		required: true,
		unique: true,
		trim: true,
		lowercase: true
	},
	password: {
		type: String,
		required: true
	}
});

// Static method
userSchema.statics.hashPassword = async function (
	password: string
): Promise<string> {
	return await bcrypt.hash(password, 10);
};

// Instance method
userSchema.methods.isValidPassword = async function (
	password: string
): Promise<boolean> {
	return await bcrypt.compare(password, this.password);
};
//Generate JWT Token
userSchema.methods.genJWT = function (): string {
	return jwt.sign(
		{ id: this._id, email: this.email },
		process.env.ACCESS_TOKEN_SECRET as string,
		{ expiresIn: '24h' }
	);
};

// Export the User model
export const User = mongoose.model<IUser, IUserModel>('User', userSchema);
