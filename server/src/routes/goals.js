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

export default router;
