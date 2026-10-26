import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IOpenSourceHistory extends Document {
  userId: Types.ObjectId;
  actionType: 'search' | 'guide' | 'review' | 'bookmark';
  skills: string[];
  experienceLevel: string;
  preferredLanguage: string;
  repoName?: string;
  issueUrl?: string;
  issueTitle?: string;
  issueNumber?: number;
  data: Record<string, any>;
  createdAt: Date;
}

const openSourceHistorySchema = new Schema<IOpenSourceHistory>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  actionType: {
    type: String,
    enum: ['search', 'guide', 'review', 'bookmark'],
    default: 'search'
  },
  skills: {
    type: [String],
    default: []
  },
  experienceLevel: {
    type: String,
    default: 'beginner'
  },
  preferredLanguage: {
    type: String,
    default: 'javascript'
  },
  repoName: String,
  issueUrl: String,
  issueTitle: String,
  issueNumber: Number,
  data: {
    type: Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

openSourceHistorySchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<IOpenSourceHistory>('OpenSourceHistory', openSourceHistorySchema);
