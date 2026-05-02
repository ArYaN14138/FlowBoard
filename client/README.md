# FlowBoard Client

React + Vite + Tailwind + Framer Motion frontend for the FlowBoard project management app.

## Pages

- Dashboard: task totals, status donut chart, productivity bars, recent activity timeline.
- Dashboard AI insights: productivity summary, overdue warnings, suggestions.
- Projects: project cards, admin/manager member management, project file uploads.
- Tasks: filters, Kanban, list, calendar card view, AI task generation, AI description generation, comments, mentions, task file uploads.
- AI assistant: floating chat panel for workspace questions and task creation.
- Settings: account role details and dark mode toggle.

## Environment

```txt
VITE_API_URL=http://localhost:5000/api
```

## Setup

```bash
cd client
cp .env.example .env
npm install
npm run dev
```
