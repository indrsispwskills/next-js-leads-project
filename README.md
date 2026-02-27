# Multi-User Workspace Task Management System

A full-stack Next.js (App Router) + MongoDB task management system supporting multi-user workspaces, invitations, RBAC, task lifecycle tracking, and dashboard analytics.

## Features Implemented

- Authentication (register, login, logout)
- Password hashing with bcrypt
- JWT-based auth with cookie session
- Workspace management (create, list, edit, delete admin-only) with per-workspace member roles
- Role-based access control (Admin / Member / Viewer)
- Member management (add by email, role update, removal) with at-least-one-admin guard
- Task CRUD APIs with assignment to workspace members, full edit support, HTML rich-text description editor, image uploads, status updates, comments, filtering, and search
- Dashboard analytics endpoint (totals, completed, pending, overdue, completion rate, tasks per user)
- Middleware route protection for pages and APIs
- Responsive professional Kanban-style UI (Trello/Asana inspired) for auth, dashboard, and workspace task board

## Environment

Copy `.env.example` to `.env.local` and configure:

```bash
MONGODB_URI=...
JWT_SECRET=...
JWT_EXPIRES_IN=7d
```

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Required API routes

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Workspace
- `POST /api/workspace/create`
- `GET /api/workspace/list`
- `DELETE /api/workspace/:id`

### Task
- `POST /api/task/create`
- `GET /api/task/list?workspaceId=...`
- `PUT /api/task/update/:id`
- `DELETE /api/task/delete/:id`

### Upload
- `POST /api/upload`

## Deployment

- Deploy on Vercel
- Use MongoDB Atlas for production database
- Set environment variables in Vercel project settings
