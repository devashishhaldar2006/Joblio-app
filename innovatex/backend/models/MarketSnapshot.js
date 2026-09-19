const mongoose = require('mongoose');

const marketSnapshotSchema = new mongoose.Schema({
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
    type: Object,
    default: {}
  },
  collected_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('MarketSnapshot', marketSnapshotSchema, 'marketsnapshots');
