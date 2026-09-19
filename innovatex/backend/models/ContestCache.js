const mongoose = require('mongoose');

const contestCacheSchema = new mongoose.Schema({
  contests: {
    type: Array,
    default: []
  },
  fetchedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ContestCache', contestCacheSchema);
