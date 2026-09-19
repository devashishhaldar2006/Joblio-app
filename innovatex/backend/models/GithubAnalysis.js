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
  report: {
    type: Object,
    required: true
  },
  analyzedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for fast cache check
githubAnalysisSchema.index({ username: 1, analyzedAt: -1 });
githubAnalysisSchema.index({ userId: 1, analyzedAt: -1 });

module.exports = mongoose.model('GithubAnalysis', githubAnalysisSchema);
