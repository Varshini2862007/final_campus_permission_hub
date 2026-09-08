import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFacultyRequest extends Document {
  id: string;
  name: string;
  facultyId?: string;
  type: string;
  dept: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  date: string;
  priority: 'High' | 'Medium' | 'Low';
  reason?: string;
}

const FacultyRequestSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    facultyId: { type: String, default: '' },
    type: { type: String, required: true },
    dept: { type: String, required: true },
    status: { type: String, default: 'Pending', enum: ['Pending', 'Approved', 'Rejected'], index: true },
    date: { type: String, required: true },
    priority: { type: String, default: 'Medium', enum: ['High', 'Medium', 'Low'] },
    reason: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

export const FacultyRequestModel: Model<IFacultyRequest> =
  mongoose.models.FacultyRequest || mongoose.model<IFacultyRequest>('FacultyRequest', FacultyRequestSchema);
