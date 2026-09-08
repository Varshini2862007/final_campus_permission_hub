import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IComment {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  timestamp: string;
}

export interface IMessage extends Document {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  type: 'message' | 'doubt';
  answers?: number;
  likes?: number;
  likedBy?: string[];
  comments?: IComment[];
  tags?: string[];
  timestamp: string;
}

const MessageSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    text: { type: String, required: true },
    authorId: { type: String, required: true },
    authorName: { type: String, required: true },
    authorRole: { type: String, required: true },
    type: { type: String, default: 'message', enum: ['message', 'doubt'], index: true },
    answers: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    likedBy: { type: [String], default: [] },
    comments: {
      type: [
        {
          id: { type: String, required: true },
          text: { type: String, required: true },
          authorId: { type: String, required: true },
          authorName: { type: String, required: true },
          authorRole: { type: String, required: true },
          timestamp: { type: String, required: true },
        }
      ],
      default: []
    },
    tags: { type: [String], default: [] },
    timestamp: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export const MessageModel: Model<IMessage> =
  mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
