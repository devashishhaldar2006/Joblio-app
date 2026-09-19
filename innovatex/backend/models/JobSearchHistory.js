const mongoose = require('mongoose');

const jobSearchHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  parsedProfile: {
    type: Object,
    default: {}
  },
  results: {
    type: Array,
    default: []
  },
  searchedAt: {
    type: Date,
    default: Date.now
  }
});

jobSearchHistorySchema.index({ userId: 1, searchedAt: -1 });

module.exports = mongoose.model('JobSearchHistory', jobSearchHistorySchema);
