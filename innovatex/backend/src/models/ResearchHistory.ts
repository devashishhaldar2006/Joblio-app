import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IResearchHistory extends Document {
  userId: Types.ObjectId;
  input: string;
  output: Record<string, any>;
  timestamp: Date;
}

const researchHistorySchema = new Schema<IResearchHistory>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  input: {
    type: String,
    required: true
  },
  output: {
    type: Schema.Types.Mixed,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

researchHistorySchema.index({ userId: 1, timestamp: -1 });

export default mongoose.model<IResearchHistory>('ResearchHistory', researchHistorySchema);
