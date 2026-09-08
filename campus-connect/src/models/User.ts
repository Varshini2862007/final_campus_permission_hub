import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'Student' | 'Faculty' | 'Admin';
  avatar?: string;
  details?: string;
}

const UserSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ['Student', 'Faculty', 'Admin'] },
    avatar: { type: String, default: '' },
    details: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

// Model for standard users collection (students)
export const UserModel: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema, 'users');

// Model for faculty collection
export const FacultyModel: Model<IUser> =
  mongoose.models.Faculty || mongoose.model<IUser>('Faculty', UserSchema, 'faculty');

// Model for admins collection
export const AdminModel: Model<IUser> =
  mongoose.models.Admin || mongoose.model<IUser>('Admin', UserSchema, 'admins');
