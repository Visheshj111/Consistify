import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import Task from '../models/Task.js';
import Goal from '../models/Goal.js';
import Activity from '../models/Activity.js';

const router = express.Router();

// Get all tasks for a goal (for roadmap view)
router.get('/all/:goalId', authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find({
      userId: req.user._id,
      goalId: req.params.goalId
    }).sort({ dayNumber: 1 });

    res.json(tasks);
  } catch (error) {
    console.error('Get all tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get today's task for active goal
router.get('/today', authenticateToken, async (req, res) => {
  try {
    // Find active goal
    const goal = await Goal.findOne({ 
      userId: req.user._id, 
      isActive: true,
      isCompleted: false 
    });
    
    if (!goal) {
      return res.status(404).json({ 
        error: 'No active goal',
        message: 'Start a new goal to see your daily task'
      });
    }

    // Find the next pending task (the current day's task)
    const task = await Task.findOne({
      userId: req.user._id,
      goalId: goal._id,
      status: 'pending'
    }).sort({ dayNumber: 1 });

    if (!task) {
      // All tasks completed!
      return res.json({
        completed: true,
        message: "You've completed all tasks for this goal! Amazing work! 🎉",
        goal
      });
    }

    // Calculate progress
    const totalTasks = await Task.countDocuments({ goalId: goal._id });
    const completedTasks = await Task.countDocuments({ 
      goalId: goal._id, 
      status: 'completed' 
    });
    const progress = Math.round((completedTasks / totalTasks) * 100);

    res.json({
      task,
      goal: {
        id: goal._id,
        title: goal.title,
        type: goal.type,
        progress,
        completedDays: goal.completedDays,
        totalDays: goal.totalDays
      }
    });
  } catch (error) {
    console.error('Get today task error:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s task' });
  }
});

// Mark task as completed
router.patch('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    task.status = 'completed';
    task.completedAt = new Date();
    await task.save();

    // Update goal progress
    const goal = await Goal.findById(task.goalId);
    goal.completedDays += 1;
    goal.currentDay += 1;

    // Check if goal is complete
    const pendingTasks = await Task.countDocuments({
      goalId: goal._id,
      status: 'pending'
    });

    if (pendingTasks === 0) {
      goal.isCompleted = true;
      goal.isActive = false;
    }

    await goal.save();

    // Create activity entry
    if (req.user.showInActivityFeed) {
      await Activity.create({
        userId: req.user._id,
        goalId: goal._id,
        type: 'completed',
        message: `${req.user.name} completed today's task`,
        isPublic: true
      });
    }

    res.json({
      task,
      message: "Great work showing up today! Rest well. 🌟"
    });
  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

// Skip task (not today)
router.patch('/:id/skip', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    task.status = 'skipped';
    task.skippedAt = new Date();
    await task.save();

    // Update goal - just shift forward, no penalties
    const goal = await Goal.findById(task.goalId);
    goal.skippedDays += 1;
    await goal.save();

    // Create a new task for this day's content, scheduled for later
    const pendingTasks = await Task.find({
      goalId: goal._id,
      status: 'pending'
    }).sort({ dayNumber: 1 });

    // Shift all pending tasks forward by one day
    for (const pendingTask of pendingTasks) {
      if (pendingTask.scheduledDate) {
        pendingTask.scheduledDate = new Date(
          pendingTask.scheduledDate.getTime() + 24 * 60 * 60 * 1000
        );
        await pendingTask.save();
      }
    }

    // Re-add the skipped task to the end of the queue
    const lastTask = pendingTasks[pendingTasks.length - 1];
    const newScheduledDate = lastTask 
      ? new Date(lastTask.scheduledDate.getTime() + 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 24 * 60 * 60 * 1000);

    const rescheduledTask = new Task({
      goalId: task.goalId,
      userId: req.user._id,
      dayNumber: task.dayNumber,
      title: task.title,
      description: task.description,
      estimatedMinutes: task.estimatedMinutes,
      actionItems: task.actionItems.map(item => ({
        text: item.text,
        completed: false
      })),
      scheduledDate: newScheduledDate
    });

    await rescheduledTask.save();

    res.json({
      message: "No worries! Life happens. Your task will be waiting when you're ready. Take care. 💙"
    });
  } catch (error) {
    console.error('Skip task error:', error);
    res.status(500).json({ error: 'Failed to skip task' });
  }
});

// Update action item completion
router.patch('/:id/action-item/:itemIndex', authenticateToken, async (req, res) => {
  try {
    const { completed } = req.body;
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const itemIndex = parseInt(req.params.itemIndex);
    if (task.actionItems[itemIndex]) {
      task.actionItems[itemIndex].completed = completed;
      await task.save();
    }

    res.json(task);
  } catch (error) {
    console.error('Update action item error:', error);
    res.status(500).json({ error: 'Failed to update action item' });
  }
});

// Get task history for a goal
router.get('/history/:goalId', authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find({
      userId: req.user._id,
      goalId: req.params.goalId,
      status: { $in: ['completed', 'skipped'] }
    }).sort({ completedAt: -1, skippedAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error('Get task history error:', error);
    res.status(500).json({ error: 'Failed to fetch task history' });
  }
});

export default router;
