import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRequest extends Document {
  id: string;
  studentId: string;
  studentName: string;
  title: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  submittedOn: string;
  priority: 'High' | 'Medium' | 'Low';
  targetFaculty?: string[];
  hasAttachment?: boolean;
}

const RequestSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    studentId: { type: String, required: true, index: true },
    studentName: { type: String, required: true },
    title: { type: String, required: true },
    reason: { type: String, default: '' },
    status: { type: String, default: 'Pending', enum: ['Pending', 'Approved', 'Rejected'], index: true },
    submittedOn: { type: String, required: true },
    priority: { type: String, default: 'Medium', enum: ['High', 'Medium', 'Low'] },
    targetFaculty: { type: [String], default: [] },
    hasAttachment: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const RequestModel: Model<IRequest> =
  mongoose.models.Request || mongoose.model<IRequest>('Request', RequestSchema);
