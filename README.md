# FlowBoard Advanced Project Management SaaS

Production-ready Trello/Jira-style project management SaaS with React, Vite, Tailwind CSS, Framer Motion, Express, MongoDB, Mongoose, JWT auth, Socket.io realtime updates, Gemini AI features, role-based access, file uploads, comments, notifications, dashboard charts, and Railway deployment support.

## Folder Structure

```txt
.
  client/                 React + Vite + Tailwind frontend
    src/api/              Axios and Socket.io clients
    src/components/       Shell, cards, charts, command palette
    src/context/          Auth and theme providers
    src/pages/            Dashboard, projects, tasks, auth, settings
  server/                 Express + MongoDB backend
    src/config/           Env and database connection
    src/controllers/      MVC controllers
    src/middleware/       Auth, roles, validation, uploads, errors
    src/models/           User, Project, Task, Comment, Activity, Notification
    src/routes/           REST API routes
    src/services/         JWT, realtime, activity helpers
```

## Features

- JWT signup/login with secure bcrypt password hashing.
- Roles: `Admin`, `Manager`, `Member`.
- Admin/Manager project creation, member invites, project file upload.
- Task creation with title, description, deadline, priority, assignee, and status.
- Drag-and-drop Kanban board, list view, and calendar-style card view.
- Socket.io live task, project, notification, comment, and activity updates.
- Advanced dashboard: stat cards, status donut chart, weekly productivity bars, recent activity timeline.
- Task comments, @name mentions, notifications, and task file attachments.
- Command palette with Ctrl+K search across projects and tasks.
- AI task generator from natural language.
- AI task description generator.
- AI dashboard insights with summaries, warnings, and suggestions.
- AI chat assistant that can answer workspace questions and create tasks for Admin/Manager users.
- Responsive premium SaaS UI with dark mode and Framer Motion transitions.

## API Routes

Base URL: `/api`

```txt
POST   /auth/register
POST   /auth/login
GET    /auth/me

GET    /users

GET    /projects
POST   /projects
PATCH  /projects/:id
DELETE /projects/:id
POST   /projects/:id/attachments

GET    /tasks?status=&priority=&project=&assignedTo=&search=
POST   /tasks
PATCH  /tasks/:id
DELETE /tasks/:id
GET    /tasks/:id/comments
POST   /tasks/:id/comments
POST   /tasks/:id/attachments

GET    /notifications
PATCH  /notifications/read

POST   /ai/generate-task
POST   /ai/generate-description
GET    /ai/insights
POST   /ai/chat

GET    /dashboard
GET    /health
```

Backward-compatible non-`/api` mounts are also enabled for local clients using `VITE_API_URL=http://localhost:5000`.

## Environment Variables

Backend: copy `server/.env.example` to `server/.env`.

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

Frontend: copy `client/.env.example` to `client/.env`.

```txt
VITE_API_URL=http://localhost:5000/api
```

## Local Development

```bash
cd server
npm install
npm run dev
```

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`.

## Railway Deployment

This repo includes a root `package.json` so Railway can build the frontend and start the Express server as one service.

1. Create a Railway project and connect this repository.
2. Add a MongoDB service or use MongoDB Atlas.
3. Set Railway variables:
   - `NODE_ENV=production`
   - `MONGO_URI=<your MongoDB connection string>`
   - `JWT_SECRET=<long random secret>`
   - `JWT_EXPIRES_IN=7d`
   - `GEMINI_API_KEY=<your Gemini API key>`
   - `GEMINI_MODEL=gemini-1.5-flash`
   - `CLIENT_URL=<your Railway app URL>`
4. Build command: `npm run build`
5. Start command: `npm start`

In production, Express serves the built Vite app from `client/dist`, uploads from `/uploads`, Socket.io from the same server, and REST APIs from `/api`.
