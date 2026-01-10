# Flow Goals 🌿

A calm, flow-focused goal achievement application that prioritizes mental wellbeing over hustle culture. Achieve your goals with consistent, gentle progress - one day at a time.

![Flow Goals](https://img.shields.io/badge/Flow-Goals-7dd3fc?style=for-the-badge)

## ✨ Philosophy

Flow Goals is built on the principle that **sustainable progress beats rushed achievement**. We intentionally avoid:

- ❌ Streaks and streak-breaking anxiety
- ❌ Guilt-inducing language
- ❌ Pressure and shaming
- ❌ Overwhelming task lists

Instead, we embrace:

- ✅ **One task at a time** - See only today's focus
- ✅ **Gentle pace** - AI suggests realistic timelines
- ✅ **No guilt skipping** - Tasks simply shift forward
- ✅ **Calm consistency** - Slow and steady wins

## 🚀 Features

### 🔐 Authentication
- Google OAuth login only - Simple and secure

### 📋 Smart Onboarding
- Choose goal type (learning, project, health, exam, habit)
- Define your specific goal
- Set your timeline with gentle suggestions if too rushed
- Confirm daily time commitment (default 1 hour)

### 🤖 AI-Powered Planning
- Generates realistic, constraint-based daily tasks
- Each task fits within your time commitment
- Concrete, actionable items - not vague instructions
- Accounts for rest and consolidation

### 📅 Daily Focus
- See only today's task - no overwhelming lists
- Action items to check off
- Simple "Completed" or "Not today" options
- 9 PM daily reminder (opt-out available)

### 🔄 Guilt-Free Skipping
- Skip days without penalty
- Tasks simply shift forward
- No increased workload
- Encouraging, supportive messaging

### 👥 Community Feed
- Neutral progress updates ("X users showed up today")
- No competitive elements
- Easy opt-out for privacy
- Designed to motivate, not pressure

## 🛠 Tech Stack

**Frontend:**
- React 18 with Vite
- TailwindCSS for styling
- Framer Motion for animations
- Zustand for state management
- React Router for navigation

**Backend:**
- Node.js with Express
- MongoDB with Mongoose
- JWT authentication
- OpenAI API for task generation
- Node-cron for scheduled reminders

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- MongoDB (local or Atlas)
- Google Cloud Console project (for OAuth)
- OpenAI API key

### 1. Clone and Install

```bash
cd flow-goals
npm run install:all
```

### 2. Configure Environment Variables

**Server (.env in /server):**
```env
MONGODB_URI=mongodb://localhost:27017/flow-goals
JWT_SECRET=your-super-secret-jwt-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
OPENAI_API_KEY=your-openai-api-key
PORT=5000
CLIENT_URL=http://localhost:5173
```

**Client (.env in /client):**
```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### 3. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth Client ID
5. Set authorized origins: `http://localhost:5173`
6. Set authorized redirect URIs: `http://localhost:5173`
7. Copy Client ID to both .env files

### 4. Run Development Servers

```bash
# Run both frontend and backend
npm run dev

# Or run separately:
npm run dev:server  # Backend on port 5000
npm run dev:client  # Frontend on port 5173
```

## 🏗 Project Structure

```
flow-goals/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── store/          # Zustand stores
│   │   ├── utils/          # API utilities
│   │   ├── App.jsx         # Main app with routing
│   │   └── main.jsx        # Entry point
│   ├── index.html
│   └── tailwind.config.js
│
├── server/                 # Express backend
│   └── src/
│       ├── models/         # MongoDB schemas
│       ├── routes/         # API routes
│       ├── services/       # Business logic
│       ├── middleware/     # Auth middleware
│       └── index.js        # Server entry
│
└── package.json            # Root workspace config
```

## 📱 Screenshots

### Login Page
Clean, calming login with Google OAuth.

### Onboarding
Step-by-step goal setup with gentle timeline suggestions.

### Dashboard
Focus on today's single task with progress tracking.

### Activity Feed
Neutral community updates without competitive pressure.

## 🎨 Design Principles

1. **Calm Color Palette** - Soft blues, sage greens, and warm neutrals
2. **Generous Whitespace** - Room to breathe
3. **Gentle Animations** - Smooth, non-jarring transitions
4. **Encouraging Copy** - Supportive, never pressuring
5. **Minimal UI** - Only show what's needed

## 🔒 Privacy

- We never share your specific goals or task details
- Activity feed shows only neutral messages
- Easy opt-out from community features
- Your data is yours

## 🤝 Contributing

We welcome contributions that align with our philosophy of calm, gentle goal achievement. Please avoid adding features that introduce pressure, competition, or anxiety.

## 📄 License

MIT License - Feel free to use and modify for your own calm journey.

---

*"The journey of a thousand miles begins with a single step."*

Take it one day at a time. You're doing great. 🌿
