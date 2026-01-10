import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// Update user settings
router.patch('/settings', authenticateToken, async (req, res) => {
  try {
    const { showInActivityFeed, reminderEnabled, timezone } = req.body;
    
    const updates = {};
    if (typeof showInActivityFeed === 'boolean') {
      updates.showInActivityFeed = showInActivityFeed;
    }
    if (typeof reminderEnabled === 'boolean') {
      updates.reminderEnabled = reminderEnabled;
    }
    if (timezone) {
      updates.timezone = timezone;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true }
    );

    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      showInActivityFeed: user.showInActivityFeed,
      reminderEnabled: user.reminderEnabled,
      timezone: user.timezone
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
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
      reminderEnabled: user.reminderEnabled,
      timezone: user.timezone,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

export default router;
