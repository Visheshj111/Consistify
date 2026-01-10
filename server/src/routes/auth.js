import express from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';

const router = express.Router();

// Initialize OAuth client lazily
let client = null;
function getOAuthClient() {
  if (!client) {
    console.log('Initializing Google OAuth with Client ID:', process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...');
    client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }
  return client;
}

// Google OAuth login
router.post('/google', async (req, res) => {
  try {
    console.log('Received Google login request');
    const { credential } = req.body;

    if (!credential) {
      console.log('No credential provided');
      return res.status(400).json({ error: 'Google credential required' });
    }

    console.log('Verifying Google token...');
    // Verify Google token
    const ticket = await getOAuthClient().verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    console.log('Token verified successfully');
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Find or create user
    let user = await User.findOne({ googleId });

    if (!user) {
      user = new User({
        googleId,
        email,
        name,
        picture
      });
      await user.save();
    } else {
      // Update last active
      user.lastActiveAt = new Date();
      await user.save();
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        onboardingComplete: user.onboardingComplete,
        showInActivityFeed: user.showInActivityFeed
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      onboardingComplete: user.onboardingComplete,
      showInActivityFeed: user.showInActivityFeed,
      reminderEnabled: user.reminderEnabled
    });
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Logout (client-side token removal, but we can track it)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;
