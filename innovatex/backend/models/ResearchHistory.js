const mongoose = require('mongoose');

const researchHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  input: {
    type: String,
    required: true
  },
  output: {
    type: Object,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

researchHistorySchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('ResearchHistory', researchHistorySchema);
