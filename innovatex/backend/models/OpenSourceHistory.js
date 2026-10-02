const mongoose = require('mongoose');

const openSourceHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  actionType: {
    type: String,
    enum: ['search', 'guide', 'review', 'bookmark'],
    default: 'search'
  },
  skills: {
    type: [String],
    default: []
  },
  experienceLevel: {
    type: String,
    default: 'beginner'
  },
  preferredLanguage: {
    type: String,
    default: 'javascript'
  },
  repoName: String,
  issueUrl: String,
  issueTitle: String,
  issueNumber: Number,
  data: {
    type: Object,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

openSourceHistorySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('OpenSourceHistory', openSourceHistorySchema);
