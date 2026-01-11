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
    const user = await User.findById(req.user._id)
      .populate('friends', 'name picture')
      .populate('friendRequests.from', 'name picture');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Transform friend requests to include sender info
    const friendRequestsWithInfo = (user.friendRequests || []).map(req => ({
      from: req.from._id || req.from,
      name: req.from.name || 'Unknown',
      picture: req.from.picture || null,
      createdAt: req.createdAt
    }));

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
      friendRequests: friendRequestsWithInfo,
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

    // Get their goals with progress
    const goals = await Goal.find({ userId: req.params.userId });
    
    // Calculate per-skill progress
    const skillsWithProgress = await Promise.all(
      goals.map(async (goal) => {
        const completedTasks = await Task.countDocuments({ goalId: goal._id, status: 'completed' });
        const totalTasks = await Task.countDocuments({ goalId: goal._id });
        const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        return {
          id: goal._id,
          title: goal.title,
          type: goal.type,
          totalDays: goal.totalDays,
          completedTasks,
          totalTasks,
          progressPercent,
          isActive: goal.isActive && !goal.isCompleted,
          isCompleted: goal.isCompleted
        };
      })
    );
    
    // Calculate overall progress
    const totalCompletedTasks = await Task.countDocuments({ userId: req.params.userId, status: 'completed' });
    const totalTasks = await Task.countDocuments({ userId: req.params.userId });
    
    // Check if already friends
    const currentUser = await User.findById(req.user._id);
    const isFriend = currentUser.friends?.includes(req.params.userId);
    const hasPendingRequest = user.friendRequests?.some(r => r.from.toString() === req.user._id.toString());

    res.json({
      id: user._id,
      name: user.name,
      picture: user.picture,
      skills: skillsWithProgress,
      completedTasks: totalCompletedTasks,
      totalTasks,
      progressPercent: totalTasks > 0 ? Math.round((totalCompletedTasks / totalTasks) * 100) : 0,
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

    // Check if already friends (prevent duplicates)
    if (currentUser.friends?.some(f => f.toString() === req.params.userId)) {
      // Already friends, just remove the request
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { friendRequests: { from: req.params.userId } }
      });
      return res.json({ message: 'Already friends' });
    }

    // Add each other as friends using $addToSet to prevent duplicates
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { friends: req.params.userId },
      $pull: { friendRequests: { from: req.params.userId } }
    });

    await User.findByIdAndUpdate(req.params.userId, {
      $addToSet: { friends: req.user._id },
      // Also remove any pending request from current user to target user
      $pull: { friendRequests: { from: req.user._id } }
    });

    res.json({ message: 'Friend added' });
  } catch (error) {
    console.error('Accept friend error:', error);
    res.status(500).json({ error: 'Failed to accept friend request' });
  }
});

// Unfriend someone
router.delete('/unfriend/:userId', authenticateToken, async (req, res) => {
  try {
    // Remove from both users' friends lists
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { friends: req.params.userId }
    });

    await User.findByIdAndUpdate(req.params.userId, {
      $pull: { friends: req.user._id }
    });

    res.json({ message: 'Unfriended successfully' });
  } catch (error) {
    console.error('Unfriend error:', error);
    res.status(500).json({ error: 'Failed to unfriend' });
  }
});

// Get friends list with their current skills and tasks
router.get('/friends', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('friends', 'name picture');
    
    const friendsWithSkills = await Promise.all(
      (user.friends || []).map(async (friend) => {
        // Get their active goal
        const activeGoal = await Goal.findOne({ userId: friend._id, isActive: true, isCompleted: false }).select('title type');
        
        // Get their current pending task (today's task)
        let currentTask = null;
        if (activeGoal) {
          currentTask = await Task.findOne({ userId: friend._id, goalId: activeGoal._id, status: 'pending' }).sort({ dayNumber: 1 }).select('title dayNumber');
        }
        
        const completedTasks = await Task.countDocuments({ userId: friend._id, status: 'completed' });
        const totalTasks = await Task.countDocuments({ userId: friend._id });
        
        return {
          id: friend._id,
          name: friend.name,
          picture: friend.picture,
          currentSkill: activeGoal?.title || null,
          currentTask: currentTask?.title || null,
          currentDay: currentTask?.dayNumber || null,
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

// Get all community members (excluding self)
router.get('/community/members', authenticateToken, async (req, res) => {
  try {
    const communityMembers = await User.find(
      { 
        _id: { $ne: req.user._id },
        showInActivityFeed: true 
      },
      'name picture'
    ).sort({ createdAt: -1 });

    const membersWithSkills = await Promise.all(
      communityMembers.map(async (member) => {
        const activeGoal = await Goal.findOne({ userId: member._id, isActive: true, isCompleted: false }).select('title');
        let currentTask = null;
        
        if (activeGoal) {
          currentTask = await Task.findOne({ userId: member._id, goalId: activeGoal._id, status: 'pending' }).sort({ dayNumber: 1 }).select('title dayNumber');
        }
        
        const completedTasks = await Task.countDocuments({ userId: member._id, status: 'completed' });
        const totalTasks = await Task.countDocuments({ userId: member._id });
        
        return {
          id: member._id,
          name: member.name,
          picture: member.picture,
          currentSkill: activeGoal?.title || null,
          currentTask: currentTask?.title || null,
          currentDay: currentTask?.dayNumber || null,
          progressPercent: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
        };
      })
    );

    res.json(membersWithSkills);
  } catch (error) {
    console.error('Get community members error:', error);
    res.status(500).json({ error: 'Failed to fetch community members' });
  }
});

export default router;
