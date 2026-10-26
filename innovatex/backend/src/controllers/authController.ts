import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getSafeUserData, sanitizeString } from '../utils/safeUser.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export const register = async (req: Request, res: Response) => {
  try {
    const rawName = req.body?.name;
    const rawEmail = req.body?.email;
    const rawPassword = req.body?.password;

    if (!rawName || !rawEmail || !rawPassword) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const cleanEmail = sanitizeString(rawEmail).toLowerCase();
    const cleanName = sanitizeString(rawName);

    if (rawPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    const newUser = new User({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword
    });

    await newUser.save();

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('[Security Warning] JWT_SECRET is not configured.');
      return res.status(500).json({ error: 'Server authentication configuration error.' });
    }

    const token = jwt.sign(
      { _id: newUser._id.toString(), name: newUser.name, email: newUser.email },
      jwtSecret,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      token,
      user: getSafeUserData(newUser)
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Registration failed due to server error.' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body ?? {};

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        error: 'Email and password are required.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user || !user.password) {
      return res.status(401).json({
        error: 'Invalid credentials.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Invalid credentials.',
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET is not configured.');
      return res.status(500).json({
        error: 'Internal server error.',
      });
    }

    const token = jwt.sign(
      {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      token,
      user: getSafeUserData(user)
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      error: 'Login failed due to server error.',
    });
  }
};

export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ error: 'User session invalid.' });
    }
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.status(200).json(user);
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
      currentPassword,
      newPassword
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

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required to set a new password.' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password || '');
      if (!isMatch) {
        return res.status(400).json({ error: 'Current password is incorrect.' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    user.updatedAt = new Date();
    await user.save();

    const sanitizedUser = await User.findById(user._id).select('-password');
    return res.status(200).json({
      message: 'Profile updated successfully.',
      user: sanitizedUser
    });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
};
