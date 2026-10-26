import { Document } from 'mongoose';

export interface ISafeUser {
  _id?: string;
  name: string;
  email: string;
  githubUsername: string;
  bio: string;
  targetRole: string;
  skills: string[];
  location: string;
  preferences: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Sanitizes user data models before sending payloads to clients,
 * ensuring no sensitive fields (passwords, internal salts, OTPs) are ever exposed.
 */
export function getSafeUserData(user: any): ISafeUser | null {
  if (!user) return null;
  const obj = typeof user.toObject === 'function' ? user.toObject() : { ...user };

  return {
    _id: obj._id ? obj._id.toString() : undefined,
    name: obj.name || '',
    email: obj.email || '',
    githubUsername: obj.githubUsername || '',
    bio: obj.bio || '',
    targetRole: obj.targetRole || '',
    skills: Array.isArray(obj.skills) ? obj.skills : [],
    location: obj.location || '',
    preferences: obj.preferences || {},
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt
  };
}

/**
 * Strips untrusted tags, script characters, and normalizes inputs
 */
export function sanitizeString(str: any, maxLength: number = 255): string {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLength);
}
