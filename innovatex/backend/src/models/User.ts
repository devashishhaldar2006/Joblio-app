import mongoose, { Schema, Document } from 'mongoose';

export interface IUserPreferences {
  emailAlerts?: boolean;
  theme?: string;
  preferredWorkType?: string;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  clerkId?: string;
  avatar?: string;
  githubUsername?: string;
  bio?: string;
  targetRole?: string;
  skills: string[];
  location?: string;
  preferences: IUserPreferences;
  hasCompletedOnboarding: boolean;
  welcomeEmailSent?: boolean;
  authProvider: 'email' | 'google' | 'github';
  resumeText?: string;
  resumeFileName?: string;
  resumeBase64?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
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
    required: false
  },
  clerkId: {
    type: String,
    sparse: true,
    index: true,
    trim: true
  },
  avatar: {
    type: String,
    default: ''
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
  hasCompletedOnboarding: {
    type: Boolean,
    default: false
  },
  authProvider: {
    type: String,
    enum: ['email', 'google', 'github'],
    default: 'email'
  },
  resumeText: {
    type: String,
    default: ''
  },
  resumeFileName: {
    type: String,
    default: ''
  },
  resumeBase64: {
    type: String,
    default: ''
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

export default mongoose.model<IUser>('User', userSchema);
