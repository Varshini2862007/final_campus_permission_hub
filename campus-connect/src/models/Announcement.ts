import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAnnouncement extends Document {
  id: string;
  title: string;
  content: string;
  type: string;
  authorName?: string;
  authorId?: string;
  targetYears?: string[];
  targetBranches?: string[];
  date: string;
}

const AnnouncementSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    type: { type: String, default: 'Global' },
    authorName: { type: String, default: 'Campus Admin' },
    authorId: { type: String, default: '' },
    targetYears: { type: [String], default: ['All Years'] },
    targetBranches: { type: [String], default: ['All Branches'] },
    date: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export const AnnouncementModel: Model<IAnnouncement> =
  mongoose.models.Announcement || mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);
