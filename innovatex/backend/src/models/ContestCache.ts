import mongoose, { Schema, Document } from 'mongoose';

export interface IContestCache extends Document {
  contests: any[];
  fetchedAt: Date;
}

const contestCacheSchema = new Schema<IContestCache>({
  contests: [Schema.Types.Mixed],
  fetchedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model<IContestCache>('ContestCache', contestCacheSchema);
