const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword
    });

    await newUser.save();

    const token = jwt.sign(
      { _id: newUser._id, name: newUser.name, email: newUser.email },
      process.env.JWT_SECRET || 'innovatex_super_secret_jwt_key_987654321',
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      token,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Registration failed due to server error.' });
  }
};

// const login = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     if (!email || !password) {
//       return res.status(400).json({ error: 'Email and password are required.' });
//     }

//     const cleanEmail = email.trim().toLowerCase();
//     let user = await User.findOne({ email: cleanEmail });
//     if (!user && cleanEmail.includes('@') && !cleanEmail.split('@')[1].includes('.')) {
//       user = await User.findOne({ email: `${cleanEmail}.com` });
//     }

//     if (!user) {
//       return res.status(400).json({ error: 'Invalid credentials.' });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(400).json({ error: 'Invalid password.' });
//     }

//     const token = jwt.sign(
//       { _id: user._id, name: user.name, email: user.email },
//       process.env.JWT_SECRET || 'innovatex_super_secret_jwt_key_987654321',
//       { expiresIn: '7d' }
//     );

//     return res.status(200).json({
//       token,
//       user: {
//         _id: user._id,
//         name: user.name,
//         email: user.email,
//         githubUsername: user.githubUsername,
//         bio: user.bio,
//         targetRole: user.targetRole,
//         skills: user.skills,
//         location: user.location,
//         preferences: user.preferences
//       }
//     });
//   } catch (err) {
//     console.error('Login error:', err);
//     return res.status(500).json({ error: 'Login failed due to server error.' });
//   }
// };


const login = async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        error: "Email and password are required.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: cleanEmail,
    });

    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials.",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        error: "Invalid credentials.",
      });
    }

    const jwtSecret = process.env.JWT_SECRET;

    // Also validate JWT_SECRET at application startup.
    if (!jwtSecret) {
      console.error("JWT_SECRET is not configured.");

      return res.status(500).json({
        error: "Internal server error.",
      });
    }

    const token = jwt.sign(
      {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
      jwtSecret,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        githubUsername: user.githubUsername,
        bio: user.bio,
        targetRole: user.targetRole,
        skills: user.skills,
        location: user.location,
        preferences: user.preferences,
      },
    });
  } catch (err) {
    console.error("Login error:", err);

    return res.status(500).json({
      error: "Login failed due to server error.",
    });
  }
};


const getProfile = async (req, res) => {
  try {
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

const updateProfile = async (req, res) => {
  try {
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

    // Password change handling
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required to set a new password.' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
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

module.exports = {
  register,
  login,
  getProfile,
  updateProfile
};
