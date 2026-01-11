import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import Goal from '../models/Goal.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import Activity from '../models/Activity.js';
import { generatePlan, checkTimelineAndSuggest } from '../services/aiPlannerService.js';

const router = express.Router();

// Check timeline before creating goal
router.post('/check-timeline', authenticateToken, (req, res) => {
  try {
    const { type, totalDays } = req.body;
    const suggestion = checkTimelineAndSuggest(type, totalDays);
    res.json(suggestion);
  } catch (error) {
    console.error('Timeline check error:', error);
    res.status(500).json({ error: 'Failed to check timeline' });
  }
});

// Create a new goal
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { type, title, description, totalDays, dailyMinutes = 60 } = req.body;

    // Validate required fields
    if (!type || !title || !totalDays) {
      return res.status(400).json({ error: 'Type, title, and totalDays are required' });
    }

    // Create the goal
    const goal = new Goal({
      userId: req.user._id,
      type,
      title,
      description,
      totalDays,
      dailyMinutes,
      startDate: new Date()
    });

    await goal.save();

    // Generate AI plan
    console.log('Generating AI plan for goal:', goal.title, {
      type: goal.type,
      totalDays: goal.totalDays,
      dailyMinutes: goal.dailyMinutes
    });
    
    const planTasks = await generatePlan(goal);
    console.log(`Generated ${planTasks.length} tasks for goal`);
    
    // Validate plan tasks
    if (!planTasks || planTasks.length === 0) {
      throw new Error('AI plan generation returned no tasks');
    }

    // Create tasks from the plan
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tasks = planTasks.map((task, index) => ({
      goalId: goal._id,
      userId: req.user._id,
      dayNumber: task.dayNumber || index + 1,
      title: task.title,
      description: task.purpose || task.description || '', // Support new 'purpose' field
      phase: task.phase || null,
      whatToLearn: task.deliverables || task.whatToLearn || [], // Support new 'deliverables' field
      resources: (task.resources || []).map(r => ({
        type: r.type || 'docs',
        title: r.title || '',
        url: r.url || '',
        creator: r.creator || ''
      })),
      skillProgression: task.skillProgression || '',
      estimatedMinutes: task.estimatedMinutes || dailyMinutes,
      actionItems: (task.actionItems || []).map(item => ({
        text: typeof item === 'string' ? item : item.text,
        completed: false
      })),
      scheduledDate: new Date(today.getTime() + index * 24 * 60 * 60 * 1000)
    }));

    await Task.insertMany(tasks);

    // Store the plan in the goal
    goal.aiGeneratedPlan = JSON.stringify(planTasks);
    await goal.save();

    // Mark onboarding as complete
    await User.findByIdAndUpdate(req.user._id, { onboardingComplete: true });

    // Create activity entry
    if (req.user.showInActivityFeed) {
      await Activity.create({
        userId: req.user._id,
        goalId: goal._id,
        type: 'started',
        message: `${req.user.name} started a new ${type} goal`,
        isPublic: true
      });
    }

    res.status(201).json({
      goal,
      message: 'Your goal has been created with a personalized plan. Take it one day at a time!'
    });
  } catch (error) {
    console.error('Goal creation error:', error);
    console.error('Error stack:', error.stack);
    
    // Send detailed error message
    const errorMessage = error.message || 'Failed to create goal';
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get all goals for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(goals);
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// Get active goal
router.get('/active', authenticateToken, async (req, res) => {
  try {
    const goal = await Goal.findOne({ 
      userId: req.user._id, 
      isActive: true,
      isCompleted: false 
    });
    
    if (!goal) {
      return res.status(404).json({ error: 'No active goal found' });
    }
    
    res.json(goal);
  } catch (error) {
    console.error('Get active goal error:', error);
    res.status(500).json({ error: 'Failed to fetch active goal' });
  }
});

// Get pending goal invites (MUST be before /:id route)
router.get('/invites', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('goalInvites.from', 'name picture');
    
    const invites = (user.goalInvites || []).map(inv => ({
      id: inv._id,
      from: {
        id: inv.from?._id,
        name: inv.from?.name,
        picture: inv.from?.picture
      },
      goalData: inv.goalData,
      createdAt: inv.createdAt
    }));

    res.json(invites);
  } catch (error) {
    console.error('Get goal invites error:', error);
    res.status(500).json({ error: 'Failed to fetch invites' });
  }
});

// Get single goal
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const goal = await Goal.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    res.json(goal);
  } catch (error) {
    console.error('Get goal error:', error);
    res.status(500).json({ error: 'Failed to fetch goal' });
  }
});

// Complete a goal
router.patch('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isCompleted: true, isActive: false },
      { new: true }
    );
    
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    // Create milestone activity
    if (req.user.showInActivityFeed) {
      await Activity.create({
        userId: req.user._id,
        goalId: goal._id,
        type: 'milestone',
        message: `${req.user.name} completed their ${goal.type} goal: "${goal.title}"! 🎉`,
        isPublic: true
      });
    }
    
    res.json(goal);
  } catch (error) {
    console.error('Complete goal error:', error);
    res.status(500).json({ error: 'Failed to complete goal' });
  }
});

// Pause/Resume a goal
router.patch('/:id/toggle-active', authenticateToken, async (req, res) => {
  try {
    const goal = await Goal.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    goal.isActive = !goal.isActive;
    await goal.save();
    
    res.json(goal);
  } catch (error) {
    console.error('Toggle goal error:', error);
    res.status(500).json({ error: 'Failed to toggle goal' });
  }
});

// Set a goal as active (switch between goals)
router.patch('/:id/set-active', authenticateToken, async (req, res) => {
  try {
    // Deactivate all other goals for this user
    await Goal.updateMany(
      { userId: req.user._id },
      { isActive: false }
    );

    // Activate the selected goal
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isActive: true },
      { new: true }
    );
    
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    res.json(goal);
  } catch (error) {
    console.error('Set active goal error:', error);
    res.status(500).json({ error: 'Failed to set active goal' });
  }
});

// Delete a goal
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const goal = await Goal.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    // Delete all tasks associated with this goal
    await Task.deleteMany({ goalId: goal._id });

    // Delete all activities associated with this goal
    await Activity.deleteMany({ goalId: goal._id });

    // Delete the goal itself
    await Goal.findByIdAndDelete(goal._id);
    
    res.json({ message: 'Goal and all associated data deleted successfully' });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

// =====================
// SHARED GOAL ENDPOINTS
// =====================

// Send a goal invite to a friend
router.post('/invite', authenticateToken, async (req, res) => {
  try {
    const { friendId, goalData } = req.body;
    
    if (!friendId || !goalData) {
      return res.status(400).json({ error: 'Friend ID and goal data are required' });
    }

    // Check if they are friends
    const user = await User.findById(req.user._id);
    if (!user.friends.includes(friendId)) {
      return res.status(400).json({ error: 'You can only invite friends' });
    }

    // Check if friend already has a pending invite from this user
    const friend = await User.findById(friendId);
    const existingInvite = friend.goalInvites?.find(
      inv => inv.from.toString() === req.user._id.toString()
    );
    if (existingInvite) {
      return res.status(400).json({ error: 'You already have a pending invite to this friend' });
    }

    // Add goal invite to friend
    await User.findByIdAndUpdate(friendId, {
      $push: {
        goalInvites: {
          from: req.user._id,
          goalData: {
            type: goalData.type,
            title: goalData.title,
            description: goalData.description,
            totalDays: goalData.totalDays,
            dailyMinutes: goalData.dailyMinutes,
            aiGeneratedPlan: goalData.aiGeneratedPlan
          }
        }
      }
    });

    res.json({ message: 'Invite sent successfully' });
  } catch (error) {
    console.error('Send goal invite error:', error);
    res.status(500).json({ error: 'Failed to send invite' });
  }
});

// Accept a goal invite - creates the shared goal for both users
router.post('/accept-invite/:inviteId', authenticateToken, async (req, res) => {
  try {
    const { inviteId } = req.params;
    
    const user = await User.findById(req.user._id);
    const invite = user.goalInvites?.find(inv => inv._id.toString() === inviteId);
    
    if (!invite) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    const { goalData } = invite;
    const senderId = invite.from;

    // Create goal for the sender (original inviter)
    const senderGoal = new Goal({
      userId: senderId,
      type: goalData.type,
      title: goalData.title,
      description: goalData.description,
      totalDays: goalData.totalDays,
      dailyMinutes: goalData.dailyMinutes,
      startDate: new Date(),
      isSharedGoal: true,
      partnerId: req.user._id,
      aiGeneratedPlan: goalData.aiGeneratedPlan
    });
    await senderGoal.save();

    // Create goal for the accepter (current user)
    const accepterGoal = new Goal({
      userId: req.user._id,
      type: goalData.type,
      title: goalData.title,
      description: goalData.description,
      totalDays: goalData.totalDays,
      dailyMinutes: goalData.dailyMinutes,
      startDate: new Date(),
      isSharedGoal: true,
      partnerId: senderId,
      partnerGoalId: senderGoal._id,
      aiGeneratedPlan: goalData.aiGeneratedPlan
    });
    await accepterGoal.save();

    // Link sender's goal to accepter's goal
    senderGoal.partnerGoalId = accepterGoal._id;
    await senderGoal.save();

    // Create tasks for both goals from the AI plan
    const planTasks = JSON.parse(goalData.aiGeneratedPlan || '[]');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const createTasksForGoal = async (goal, userId) => {
      const tasks = planTasks.map((task, index) => ({
        goalId: goal._id,
        userId: userId,
        dayNumber: task.dayNumber || index + 1,
        title: task.title,
        description: task.purpose || task.description || '',
        phase: task.phase || null,
        whatToLearn: task.deliverables || task.whatToLearn || [],
        resources: (task.resources || []).map(r => ({
          type: r.type || 'docs',
          title: r.title || '',
          url: r.url || '',
          creator: r.creator || ''
        })),
        skillProgression: task.skillProgression || '',
        estimatedMinutes: task.estimatedMinutes || goalData.dailyMinutes,
        actionItems: (task.actionItems || []).map(item => ({
          text: typeof item === 'string' ? item : item.text,
          completed: false
        })),
        scheduledDate: new Date(today.getTime() + index * 24 * 60 * 60 * 1000)
      }));
      await Task.insertMany(tasks);
    };

    await createTasksForGoal(senderGoal, senderId);
    await createTasksForGoal(accepterGoal, req.user._id);

    // Mark sender's onboarding as complete
    await User.findByIdAndUpdate(senderId, { onboardingComplete: true });
    // Mark accepter's onboarding as complete
    await User.findByIdAndUpdate(req.user._id, { onboardingComplete: true });

    // Remove the invite
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { goalInvites: { _id: inviteId } }
    });

    // Create activity entries
    const sender = await User.findById(senderId);
    if (sender.showInActivityFeed) {
      await Activity.create({
        userId: senderId,
        goalId: senderGoal._id,
        type: 'started',
        message: `${sender.name} started learning ${goalData.title} with ${user.name}!`,
        isPublic: true
      });
    }
    if (user.showInActivityFeed) {
      await Activity.create({
        userId: req.user._id,
        goalId: accepterGoal._id,
        type: 'started',
        message: `${user.name} started learning ${goalData.title} with ${sender.name}!`,
        isPublic: true
      });
    }

    res.json({
      goal: accepterGoal,
      partnerGoal: senderGoal,
      message: 'Goal accepted! You and your friend are now learning together.'
    });
  } catch (error) {
    console.error('Accept goal invite error:', error);
    res.status(500).json({ error: 'Failed to accept invite' });
  }
});

// Decline a goal invite
router.delete('/decline-invite/:inviteId', authenticateToken, async (req, res) => {
  try {
    const { inviteId } = req.params;
    
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { goalInvites: { _id: inviteId } }
    });

    res.json({ message: 'Invite declined' });
  } catch (error) {
    console.error('Decline goal invite error:', error);
    res.status(500).json({ error: 'Failed to decline invite' });
  }
});

// Get partner's progress for a shared goal
router.get('/:id/partner-progress', authenticateToken, async (req, res) => {
  try {
    const goal = await Goal.findOne({ 
      _id: req.params.id, 
      userId: req.user._id,
      isSharedGoal: true
    }).populate('partnerId', 'name picture');
    
    if (!goal) {
      return res.status(404).json({ error: 'Shared goal not found' });
    }

    // Get partner's goal and tasks
    const partnerGoal = await Goal.findById(goal.partnerGoalId);
    if (!partnerGoal) {
      return res.status(404).json({ error: 'Partner goal not found' });
    }

    const partnerTasks = await Task.find({ goalId: partnerGoal._id }).sort({ dayNumber: 1 });

    res.json({
      partner: goal.partnerId,
      partnerGoal: {
        id: partnerGoal._id,
        currentDay: partnerGoal.currentDay,
        completedDays: partnerGoal.completedDays,
        isCompleted: partnerGoal.isCompleted
      },
      partnerTasks: partnerTasks.map(t => ({
        dayNumber: t.dayNumber,
        title: t.title,
        status: t.status
      }))
    });
  } catch (error) {
    console.error('Get partner progress error:', error);
    res.status(500).json({ error: 'Failed to fetch partner progress' });
  }
});

export default router;
