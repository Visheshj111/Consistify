import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cron from 'node-cron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server root directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Safe diagnostic (does not print the key)
console.log('OpenAI API key configured:', Boolean((process.env.OPENAI_API_KEY || process.env.OPENAL_API_KEY || '').trim()));

import authRoutes from './routes/auth.js';
import goalRoutes from './routes/goals.js';
import taskRoutes from './routes/tasks.js';
import activityRoutes from './routes/activity.js';
import userRoutes from './routes/users.js';
import { sendDailyReminders } from './services/reminderService.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'https://consistify-client.vercel.app',
  credentials: true
}));  
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Backend is working' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Flow Goals API is running' });
});

// Schedule daily reminder at 9 PM
cron.schedule('0 21 * * *', () => {
  console.log('Sending daily reminders...');
  sendDailyReminders();
});

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/flow-goals')
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

export default app;
