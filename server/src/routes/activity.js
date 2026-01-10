import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import Activity from '../models/Activity.js';
import User from '../models/User.js';
import Task from '../models/Task.js';

const router = express.Router();

// Get public activity feed
router.get('/feed', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const skip = parseInt(req.query.skip) || 0;

    // Get users who have opted into the activity feed
    const publicUsers = await User.find({ showInActivityFeed: true }).select('_id');
    const publicUserIds = publicUsers.map(u => u._id);

    // Get public activities
    const activities = await Activity.find({
      isPublic: true,
      userId: { $in: publicUserIds }
    })
      .populate('userId', 'name picture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json(activities);
  } catch (error) {
    console.error('Get activity feed error:', error);
    res.status(500).json({ error: 'Failed to fetch activity feed' });
  }
});

// Get daily stats (neutral, encouraging)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    // Count users who completed tasks today
    const completedToday = await Task.distinct('userId', {
      status: 'completed',
      completedAt: { $gte: today, $lt: tomorrow }
    });

    // Count users who showed up (either completed or were active)
    const activeToday = await User.countDocuments({
      lastActiveAt: { $gte: today }
    });

    // Get total community size (opted-in users)
    const communitySize = await User.countDocuments({
      showInActivityFeed: true,
      onboardingComplete: true
    });

    res.json({
      usersCompletedToday: completedToday.length,
      usersActiveToday: activeToday,
      communitySize,
      // Neutral, encouraging messages
      message: completedToday.length > 0 
        ? `${completedToday.length} ${completedToday.length === 1 ? 'person' : 'people'} showed up for their goals today.`
        : 'A new day, a fresh opportunity. Take your time.'
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get user's own activity
router.get('/my-activity', authenticateToken, async (req, res) => {
  try {
    const activities = await Activity.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(activities);
  } catch (error) {
    console.error('Get my activity error:', error);
    res.status(500).json({ error: 'Failed to fetch your activity' });
  }
});

export default router;
