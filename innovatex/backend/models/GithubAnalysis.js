const mongoose = require('mongoose');

const githubAnalysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
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
  changes: {
    type: Array,
    default: []
  },
  verifiedRecommendations: {
    type: Array,
    default: []
  },
  recommendationStatuses: {
    type: Object,
    default: {}
  },
  selectedGoal: {
    type: String,
    default: 'Improve GitHub profile'
  },
  report: {
    type: Object,
    required: true
  },
  analyzedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for fast cache check and historical queries
githubAnalysisSchema.index({ username: 1, analyzedAt: -1 });
githubAnalysisSchema.index({ userId: 1, analyzedAt: -1 });
githubAnalysisSchema.index({ userId: 1, username: 1, analyzedAt: -1 });

module.exports = mongoose.model('GithubAnalysis', githubAnalysisSchema);
