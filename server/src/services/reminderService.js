import User from '../models/User.js';
import Task from '../models/Task.js';
import Goal from '../models/Goal.js';

export async function sendDailyReminders() {
  try {
    // Get all users with reminders enabled
    const users = await User.find({ 
      reminderEnabled: true,
      onboardingComplete: true 
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const user of users) {
      // Find active goals
      const activeGoals = await Goal.find({ 
        userId: user._id, 
        isActive: true,
        isCompleted: false 
      });

      for (const goal of activeGoals) {
        // Find today's pending task
        const pendingTask = await Task.findOne({
          userId: user._id,
          goalId: goal._id,
          status: 'pending',
          scheduledDate: {
            $gte: today,
            $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
          }
        });

        if (pendingTask) {
          // In a real app, you'd integrate with a notification service
          // like Firebase Cloud Messaging, OneSignal, or email service
          console.log(`Reminder for ${user.name}: Complete "${pendingTask.title}"`);
          
          // You could also store the reminder in a Notification collection
          // or send via email/push notification
        }
      }
    }

    console.log(`Daily reminders processed for ${users.length} users`);
  } catch (error) {
    console.error('Error sending daily reminders:', error);
  }
}

export default { sendDailyReminders };
