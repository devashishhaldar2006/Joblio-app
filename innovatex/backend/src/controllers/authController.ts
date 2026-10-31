import JobBookmark from '../models/JobBookmark.js';
import JobSearchHistory from '../models/JobSearchHistory.js';
import GithubAnalysis from '../models/GithubAnalysis.js';
import OpenSourceHistory from '../models/OpenSourceHistory.js';
import { Response } from 'express';
import User from '../models/User.js';
import { getSafeUserData } from '../utils/safeUser.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { sendWelcomeEmail } from '../utils/emailService.js';

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
      resumeFileName,
      resumeBase64,
      removeResume,
    } = req.body;

    if (name) user.name = name;
    if (githubUsername !== undefined) user.githubUsername = githubUsername.trim().replace(/^@/, '');
    if (bio !== undefined) user.bio = bio;
    if (targetRole !== undefined) user.targetRole = targetRole;
    if (Array.isArray(skills)) user.skills = skills;
    if (location !== undefined) user.location = location;
    if (preferences && typeof preferences === 'object') {
      user.preferences = { ...user.preferences, ...preferences };
    }
    if (resumeFileName) {
      user.resumeFileName = resumeFileName;
    }
    if (resumeBase64) {
      user.resumeBase64 = resumeBase64;
    }
    if (removeResume) {
      user.resumeFileName = '';
      user.resumeBase64 = '';
      user.resumeText = '';
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

    // Welcome email is only dispatched on new user sign-up creation, not on routine session sync.

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

    // Trigger developer welcome email on onboarding completion
    if (!user.welcomeEmailSent && user.email && !user.email.endsWith('@clerk.user')) {
      sendWelcomeEmail({
        toEmail: user.email,
        userName: user.name,
        targetRole: user.targetRole,
        authProvider: user.authProvider,
      }).then(res => {
        if (res.success) {
          User.findByIdAndUpdate(user._id, { welcomeEmailSent: true }).catch(() => {});
        }
      }).catch(err => {
        console.warn('[AuthController] Welcome email onboarding warning:', err.message);
      });
    }

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

export const deleteAccount = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ error: 'User session invalid.' });
    }
    const userId = req.user._id;

    // 1. Delete all user-associated records across collections
    await Promise.all([
      JobBookmark.deleteMany({ userId }),
      JobSearchHistory.deleteMany({ userId }),
      GithubAnalysis.deleteMany({ userId }),
      OpenSourceHistory.deleteMany({ userId }),
    ]);

    // 2. Delete user document from MongoDB
    await User.findByIdAndDelete(userId);

    return res.status(200).json({
      message: 'Account and all associated personal data permanently purged.',
    });
  } catch (err) {
    console.error('Delete account error:', err);
    return res.status(500).json({ error: 'Failed to delete account data.' });
  }
};
