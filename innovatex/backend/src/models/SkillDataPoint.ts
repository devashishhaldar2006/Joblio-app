import mongoose, { Schema, Document } from 'mongoose';

export interface ISkillDataPoint extends Document {
  skill_name: string;
  week_start: Date;
  count: number;
  percentage_of_total: number;
  total_jobs_that_week: number;
  collected_at: Date;
}

const skillDataPointSchema = new Schema<ISkillDataPoint>({
  skill_name: {
    type: String,
    required: true,
    index: true
  },
  week_start: {
    type: Date,
    required: true,
    index: true
  },
  count: {
    type: Number,
    required: true
  },
  percentage_of_total: {
    type: Number,
    required: true
  },
  total_jobs_that_week: {
    type: Number,
    required: true
  },
  collected_at: {
    type: Date,
    default: Date.now
  }
});

skillDataPointSchema.index({ skill_name: 1, week_start: 1 }, { unique: true });

export default mongoose.model<ISkillDataPoint>('SkillDataPoint', skillDataPointSchema, 'skilldatapoints');
