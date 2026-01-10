import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  goalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dayNumber: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  phase: {
    type: String
  },
  whatToLearn: [{
    type: String
  }],
  resources: [{
    type: {
      type: String,
      enum: ['docs', 'video', 'article', 'tutorial', 'book']
    },
    title: String,
    url: String,
    creator: String
  }],
  skillProgression: {
    type: String
  },
  estimatedMinutes: {
    type: Number,
    required: true
  },
  actionItems: [{
    text: String,
    completed: Boolean
  }],
  status: {
    type: String,
    enum: ['pending', 'completed', 'skipped'],
    default: 'pending'
  },
  scheduledDate: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  skippedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
taskSchema.index({ userId: 1, goalId: 1, dayNumber: 1 });
taskSchema.index({ userId: 1, scheduledDate: 1 });

export default mongoose.model('Task', taskSchema);
