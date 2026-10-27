import { Response } from 'express';
import User from '../models/User.js';
import { getSafeUserData } from '../utils/safeUser.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ error: 'User session invalid.' });
    }
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.status(200).json(getSafeUserData(user));
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ error: 'User session invalid.' });
    }
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const {
      name,
      githubUsername,
      bio,
      targetRole,
      skills,
      location,
      preferences,
    } = req.body;

    if (name) user.name = name;
    if (githubUsername !== undefined) user.githubUsername = githubUsername.trim();
    if (bio !== undefined) user.bio = bio;
    if (targetRole !== undefined) user.targetRole = targetRole;
    if (Array.isArray(skills)) user.skills = skills;
    if (location !== undefined) user.location = location;
    if (preferences && typeof preferences === 'object') {
      user.preferences = { ...user.preferences, ...preferences };
    }

    user.updatedAt = new Date();
    await user.save();

    const sanitizedUser = await User.findById(user._id).select('-password');
    return res.status(200).json({
      message: 'Profile updated successfully.',
      user: getSafeUserData(sanitizedUser)
    });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
};

export const syncClerkUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User record not found.' });
    }
    return res.status(200).json({
      message: 'Synced successfully',
      user: getSafeUserData(user)
    });
  } catch (err) {
    console.error('Sync Clerk user error:', err);
    return res.status(500).json({ error: 'Failed to sync user session.' });
  }
};

export const completeOnboarding = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ error: 'User session invalid.' });
    }
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const { githubUsername, targetRole, skills, resumeText, resumeFileName } = req.body;

    if (githubUsername !== undefined) {
      user.githubUsername = githubUsername.trim().replace(/^@/, '');
    }
    if (targetRole) {
      user.targetRole = targetRole.trim();
    }
    if (Array.isArray(skills) && skills.length > 0) {
      user.skills = skills;
    }
    if (resumeText) {
      user.resumeText = resumeText;
    }
    if (resumeFileName) {
      user.resumeFileName = resumeFileName;
    }

    user.hasCompletedOnboarding = true;
    user.updatedAt = new Date();
    await user.save();

    const sanitizedUser = await User.findById(user._id).select('-password');
    return res.status(200).json({
      message: 'Onboarding completed successfully.',
      user: getSafeUserData(sanitizedUser)
    });
  } catch (err) {
    console.error('Complete onboarding error:', err);
    return res.status(500).json({ error: 'Failed to complete onboarding.' });
  }
};
