import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IJobSearchHistory extends Document {
  userId: Types.ObjectId;
  parsedProfile: Record<string, any>;
  results: any[];
  searchedAt: Date;
}

const jobSearchHistorySchema = new Schema<IJobSearchHistory>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  parsedProfile: {
    type: Schema.Types.Mixed,
    default: {}
  },
  results: [Schema.Types.Mixed],
  searchedAt: {
    type: Date,
    default: Date.now
  }
});

jobSearchHistorySchema.index({ userId: 1, searchedAt: -1 });

export default mongoose.model<IJobSearchHistory>('JobSearchHistory', jobSearchHistorySchema);
