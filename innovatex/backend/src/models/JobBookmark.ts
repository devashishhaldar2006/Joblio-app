import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IJobBookmark extends Document {
  userId: Types.ObjectId;
  jobId: string;
  title: string;
  company: string;
  location: string;
  employmentType: string;
  salaryRange: string;
  applyLink: string;
  matchScore: number;
  matchReason: string;
  skillOverlap: string[];
  missingSkills: string[];
  status: 'Saved' | 'Applied' | 'Interviewing' | 'Offer' | 'Rejected';
  notes: string;
  rawJobData: Record<string, any>;
  bookmarkedAt: Date;
  updatedAt: Date;
}

const jobBookmarkSchema = new Schema<IJobBookmark>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jobId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  company: {
    type: String,
    default: 'Unknown'
  },
  location: {
    type: String,
    default: 'Remote'
  },
  employmentType: {
    type: String,
    default: 'FULLTIME'
  },
  salaryRange: {
    type: String,
    default: 'Competitive'
  },
  applyLink: {
    type: String,
    default: ''
  },
  matchScore: {
    type: Number,
    default: 0
  },
  matchReason: {
    type: String,
    default: ''
  },
  skillOverlap: {
    type: [String],
    default: []
  },
  missingSkills: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['Saved', 'Applied', 'Interviewing', 'Offer', 'Rejected'],
    default: 'Saved'
  },
  notes: {
    type: String,
    default: ''
  },
  rawJobData: {
    type: Schema.Types.Mixed,
    default: {}
  },
  bookmarkedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

jobBookmarkSchema.index({ userId: 1, jobId: 1 }, { unique: true });
jobBookmarkSchema.index({ userId: 1, status: 1 });

export default mongoose.model<IJobBookmark>('JobBookmark', jobBookmarkSchema);
