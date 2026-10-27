import { Document } from 'mongoose';

export interface ISafeUser {
  _id?: string;
  name: string;
  email: string;
  clerkId?: string;
  avatar?: string;
  githubUsername: string;
  bio: string;
  targetRole: string;
  skills: string[];
  location: string;
  preferences: Record<string, any>;
  hasCompletedOnboarding: boolean;
  authProvider: string;
  hasResume: boolean;
  resumeFileName?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export function getSafeUserData(user: any): ISafeUser | null {
  if (!user) return null;
  const obj = typeof user.toObject === 'function' ? user.toObject() : { ...user };

  return {
    _id: obj._id ? obj._id.toString() : undefined,
    name: obj.name || '',
    email: obj.email || '',
    clerkId: obj.clerkId || '',
    avatar: obj.avatar || '',
    githubUsername: obj.githubUsername || '',
    bio: obj.bio || '',
    targetRole: obj.targetRole || '',
    skills: Array.isArray(obj.skills) ? obj.skills : [],
    location: obj.location || '',
    preferences: obj.preferences || {},
    hasCompletedOnboarding: Boolean(obj.hasCompletedOnboarding),
    authProvider: obj.authProvider || 'email',
    hasResume: Boolean((obj.resumeText && obj.resumeText.length > 20) || obj.resumeFileName),
    resumeFileName: obj.resumeFileName || '',
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt
  };
}

export function sanitizeString(str: any, maxLength: number = 255): string {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLength);
}
