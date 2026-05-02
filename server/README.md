# FlowBoard Server

Express + MongoDB + Socket.io + Gemini API for the FlowBoard project management app.

## Structure

```txt
server/
  src/app.js
  src/config/
  src/controllers/
  src/middleware/
  src/models/
  src/routes/
  src/services/
  src/utils/
  uploads/
```

## API

All app routes are prefixed with `/api`.

```txt
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
GET    /api/users
GET    /api/projects
POST   /api/projects
PATCH  /api/projects/:id
DELETE /api/projects/:id
POST   /api/projects/:id/attachments
GET    /api/tasks
POST   /api/tasks
PATCH  /api/tasks/:id
DELETE /api/tasks/:id
GET    /api/tasks/:id/comments
POST   /api/tasks/:id/comments
POST   /api/tasks/:id/attachments
GET    /api/notifications
PATCH  /api/notifications/read
POST   /api/ai/generate-task
POST   /api/ai/generate-description
GET    /api/ai/insights
POST   /api/ai/chat
GET    /api/dashboard
```

Admin-only routes are enforced with role middleware. Members can only access assigned tasks and update task status.

## Environment

```txt
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://127.0.0.1:27017/flowboard
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-1.5-flash
```

## Setup

```bash
cd server
cp .env.example .env
npm install
npm run dev
```
