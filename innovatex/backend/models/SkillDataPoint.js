const mongoose = require('mongoose');

const skillDataPointSchema = new mongoose.Schema({
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

// Compound unique index on (skill_name + week_start)
skillDataPointSchema.index({ skill_name: 1, week_start: 1 }, { unique: true });

module.exports = mongoose.model('SkillDataPoint', skillDataPointSchema, 'skilldatapoints');
