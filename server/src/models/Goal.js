import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['learning', 'project', 'health', 'exam', 'habit'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  totalDays: {
    type: Number,
    required: true,
    min: 1
  },
  dailyMinutes: {
    type: Number,
    required: true,
    default: 60 // 1 hour default
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  currentDay: {
    type: Number,
    default: 1
  },
  completedDays: {
    type: Number,
    default: 0
  },
  skippedDays: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  aiGeneratedPlan: {
    type: String // JSON string of the full plan
  },
  // Shared goal fields
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  partnerGoalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    default: null
  },
  isSharedGoal: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Goal', goalSchema);
