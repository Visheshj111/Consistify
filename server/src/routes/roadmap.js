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

export default router;
