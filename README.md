# Persisto

A calm, flow-focused goal achievement app that prioritizes mental wellbeing over hustle culture.

## Philosophy

Sustainable progress beats rushed achievement. No streaks, no guilt, no pressure.

- One task at a time - See only today's focus
- Guilt-free skipping - Tasks simply shift forward
- AI-powered planning - Realistic, constraint-based daily tasks

## Tech Stack

**Frontend:** React, Vite, TailwindCSS, Zustand, Framer Motion

**Backend:** Node.js, Express, MongoDB, OpenAI API

## Installation

```bash
npm run install:all
```

**Server (.env in /server):**
```
MONGODB_URI=your-mongodb-uri
JWT_SECRET=your-jwt-secret
GOOGLE_CLIENT_ID=your-google-client-id
OPENAI_API_KEY=your-openai-api-key
PORT=5000
CLIENT_URL=http://localhost:5173
```

**Client (.env in /client):**
```
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

## Run

```bash
npm run dev
```

## License

MIT
