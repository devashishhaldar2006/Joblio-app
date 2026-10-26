import mongoose, { Schema, Document } from 'mongoose';

export interface ITopSkill {
  skill: string;
  percentage: number;
  count: number;
  wow_change: number;
}

export interface IMarketSnapshot extends Document {
  week_start: Date;
  total_jobs_collected: number;
  top_skills: ITopSkill[];
  emerging_skills: string[];
  co_occurrences: Record<string, any>;
  collected_at: Date;
}

const marketSnapshotSchema = new Schema<IMarketSnapshot>({
  week_start: {
    type: Date,
    required: true,
    unique: true,
    index: true
  },
  total_jobs_collected: {
    type: Number,
    default: 0
  },
  top_skills: [{
    skill: { type: String, required: true },
    percentage: { type: Number, required: true },
    count: { type: Number, default: 0 },
    wow_change: { type: Number, default: 0.0 }
  }],
  emerging_skills: [{
    type: String
  }],
  co_occurrences: {
    type: Schema.Types.Mixed,
    default: {}
  },
  collected_at: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model<IMarketSnapshot>('MarketSnapshot', marketSnapshotSchema, 'marketsnapshots');
