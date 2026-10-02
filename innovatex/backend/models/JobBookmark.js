const mongoose = require('mongoose');

const jobBookmarkSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jobId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  company: {
    type: String,
    default: 'Unknown'
  },
  location: {
    type: String,
    default: 'Remote'
  },
  employmentType: {
    type: String,
    default: 'FULLTIME'
  },
  salaryRange: {
    type: String,
    default: 'Competitive'
  },
  applyLink: {
    type: String,
    default: ''
  },
  matchScore: {
    type: Number,
    default: 0
  },
  matchReason: {
    type: String,
    default: ''
  },
  skillOverlap: {
    type: [String],
    default: []
  },
  missingSkills: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['Saved', 'Applied', 'Interviewing', 'Offer', 'Rejected'],
    default: 'Saved'
  },
  notes: {
    type: String,
    default: ''
  },
  rawJobData: {
    type: Object,
    default: {}
  },
  bookmarkedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

jobBookmarkSchema.index({ userId: 1, jobId: 1 }, { unique: true });
jobBookmarkSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('JobBookmark', jobBookmarkSchema);
