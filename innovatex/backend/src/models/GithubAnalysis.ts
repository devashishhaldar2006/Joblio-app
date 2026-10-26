import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IGithubAnalysis extends Document {
  userId: Types.ObjectId;
  username: string;
  methodologyVersion: string;
  overallScore: number;
  scoreDelta: number | null;
  changes: any[];
  verifiedRecommendations: any[];
  recommendationStatuses: Record<string, any>;
  selectedGoal: string;
  report: Record<string, any>;
  analyzedAt: Date;
}

const githubAnalysisSchema = new Schema<IGithubAnalysis>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  methodologyVersion: {
    type: String,
    default: 'v2.1'
  },
  overallScore: {
    type: Number,
    default: 0
  },
  scoreDelta: {
    type: Number,
    default: null
  },
  changes: [Schema.Types.Mixed],
  verifiedRecommendations: [Schema.Types.Mixed],
  recommendationStatuses: {
    type: Schema.Types.Mixed,
    default: {}
  },
  selectedGoal: {
    type: String,
    default: 'Improve GitHub profile'
  },
  report: {
    type: Schema.Types.Mixed,
    required: true
  },
  analyzedAt: {
    type: Date,
    default: Date.now
  }
});

githubAnalysisSchema.index({ username: 1, analyzedAt: -1 });
githubAnalysisSchema.index({ userId: 1, analyzedAt: -1 });
githubAnalysisSchema.index({ userId: 1, username: 1, analyzedAt: -1 });

export default mongoose.model<IGithubAnalysis>('GithubAnalysis', githubAnalysisSchema);
