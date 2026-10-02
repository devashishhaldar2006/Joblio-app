const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  githubUsername: {
    type: String,
    default: '',
    trim: true
  },
  bio: {
    type: String,
    default: '',
    trim: true
  },
  targetRole: {
    type: String,
    default: 'Software Engineer',
    trim: true
  },
  skills: {
    type: [String],
    default: []
  },
  location: {
    type: String,
    default: '',
    trim: true
  },
  preferences: {
    emailAlerts: { type: Boolean, default: true },
    theme: { type: String, default: 'dark' },
    preferredWorkType: { type: String, default: 'Remote' }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
