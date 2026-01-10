import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import User from '../models/User.js';
import Goal from '../models/Goal.js';
import Task from '../models/Task.js';

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
    const user = await User.findById(req.user._id).populate('friends', 'name picture');
    
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
      friends: user.friends || [],
      friendRequests: user.friendRequests || [],
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Get another user's public profile
router.get('/profile/:userId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('name picture createdAt showInActivityFeed');
    
    if (!user || !user.showInActivityFeed) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get their public goals
    const goals = await Goal.find({ userId: req.params.userId }).select('title type totalDays');
    
    // Calculate their progress
    const completedTasks = await Task.countDocuments({ userId: req.params.userId, status: 'completed' });
    const totalTasks = await Task.countDocuments({ userId: req.params.userId });
    
    // Check if already friends
    const currentUser = await User.findById(req.user._id);
    const isFriend = currentUser.friends?.includes(req.params.userId);
    const hasPendingRequest = user.friendRequests?.some(r => r.from.toString() === req.user._id.toString());

    res.json({
      id: user._id,
      name: user.name,
      picture: user.picture,
      skills: goals.map(g => ({ title: g.title, type: g.type })),
      completedTasks,
      totalTasks,
      progressPercent: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      isFriend,
      hasPendingRequest,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Send friend request
router.post('/friend-request/:userId', authenticateToken, async (req, res) => {
  try {
    if (req.params.userId === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot add yourself as friend' });
    }

    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already friends
    const currentUser = await User.findById(req.user._id);
    if (currentUser.friends?.includes(req.params.userId)) {
      return res.status(400).json({ error: 'Already friends' });
    }

    // Check if request already exists
    const existingRequest = targetUser.friendRequests?.find(r => r.from.toString() === req.user._id.toString());
    if (existingRequest) {
      return res.status(400).json({ error: 'Friend request already sent' });
    }

    // Add friend request
    await User.findByIdAndUpdate(req.params.userId, {
      $push: { friendRequests: { from: req.user._id } }
    });

    res.json({ message: 'Friend request sent' });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
});

// Accept friend request
router.post('/accept-friend/:userId', authenticateToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const requestExists = currentUser.friendRequests?.find(r => r.from.toString() === req.params.userId);
    
    if (!requestExists) {
      return res.status(404).json({ error: 'No friend request from this user' });
    }

    // Add each other as friends
    await User.findByIdAndUpdate(req.user._id, {
      $push: { friends: req.params.userId },
      $pull: { friendRequests: { from: req.params.userId } }
    });

    await User.findByIdAndUpdate(req.params.userId, {
      $push: { friends: req.user._id }
    });

    res.json({ message: 'Friend added' });
  } catch (error) {
    console.error('Accept friend error:', error);
    res.status(500).json({ error: 'Failed to accept friend request' });
  }
});

// Get friends list with their current skills
router.get('/friends', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('friends', 'name picture');
    
    const friendsWithSkills = await Promise.all(
      (user.friends || []).map(async (friend) => {
        const goals = await Goal.find({ userId: friend._id }).select('title type');
        const completedTasks = await Task.countDocuments({ userId: friend._id, status: 'completed' });
        const totalTasks = await Task.countDocuments({ userId: friend._id });
        
        return {
          id: friend._id,
          name: friend.name,
          picture: friend.picture,
          skills: goals.map(g => g.title),
          progressPercent: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
        };
      })
    );

    res.json(friendsWithSkills);
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

export default router;
