# TaskFlow — Project Management System

### TaskFlow is a modern web application for project and task management using the Kanban methodology. It enables teams to organize work efficiently, track progress, and collaborate in real-time.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)

## Features

### Project Management

- Create and edit projects
- Customizable columns (Backlog, Todo, In Progress, Done)
- Drag-and-drop task movement between columns
- Task filtering by priority, assignee, and search
- Team Collaboration
- Invite team members to projects
- Flexible role system (Owner, Admin, Member, Viewer)
- Assign tasks to team members

### Tasks & Comments

- Create tasks with Markdown-formatted descriptions
- Priority levels (Low, Medium, High)
- Nested comments on tasks
- Mentions and discussions
- Search & Analytics
- Global search across projects and tasks (Ctrl+/)
- Task statistics and metrics
- Project activity feed
- Modern light theme design
- Responsive layout
- Smooth animations and transitions

## 🛠 Tech Stack

### Frontend

- **Next.js 14** — React framework with App Router
- **TypeScript** — Type safety
- **tRPC** — Type-safe API
- **React Query** — Server state management
- **Tailwind CSS** — Styling
- **Radix UI** — Accessible primitives
- **@dnd-kit** — Drag-and-drop functionality
- **TipTap** — WYSIWYG editor
- **next-auth** — Authentication
- **nuqs** — URL state management

### Backend

- **PostgreSQL** — Database
- **Drizzle ORM** — Type-safe ORM
- **Next.js API Routes** — Server logic
- **tRPC** — RPC framework

### Tools

- **pnpm** — Package manager
- **ESLint + Prettier** — Linting and formatting

## Installation

### Requirements

- Node.js 18+
- Docker and Docker Compose
- PostgreSQL 16+ (or Docker)
- pnpm 9+

## Installation Steps

1. Clone the repository:

```bash
git clone git@github.com:YuliaVorotintseva/taskflow.git
cd taskflow
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

4. Start database:

```bash
pnpm dev:up
```

5. Initialize the database:

```bash
pnpm db:generate
pnpm db:push
```

6. Run the application:

```bash
pnpm dev
# Open http://localhost:3000
```

## Usage

### Creating a Project

1. Go to Dashboard
2. Click "+ Create Project"
3. Enter project name and URL
4. Click "Create"

### Inviting Team Members

1. Open a project
2. Click "Members" → "Invite"
3. Enter user's email
4. Select role

### Working with Tasks

- **Create**: Click "+ Add Task" in the desired column
- **Move**: Drag and drop tasks between columns
- **Edit**: Click on a task to open the modal window
- **Quick Edit**: Click on the task title for inline editing

## Keyboard Shortcuts

- **Ctrl+/** — Global search
- **Ctrl+S** — Save task changes
- **Esc** — Close modal

## 🗂 Project Structure

```bash
taskflow/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (app)/             # Protected routes
│   │   │   ├── dashboard/     # Dashboard
│   │   │   ── [projectSlug]/ # Project page
│   │   │       ├── @sidebar/  # Parallel route (sidebar)
│   │   │       ├── @board/    # Parallel route (board)
│   │   │       ├── @activity/ # Parallel route (activity)
│   │   │       ── (.)issue/  # Intercepting route (modal)
│   │   ├── (auth)/            # Authentication routes
│   │   ├── api/               # API routes (tRPC, auth)
│   │   └── layout.tsx         # Root layout
│   │
│   ├── components/            # React components
│   │   ├── board/             # Kanban board components
│   │   ├── issue/             # Task components
│   │   ├── project/           # Project components
│   │   ├── layout/            # Layout components
│   │   └── ui/                # UI components (shadcn)
│   │
│   ├── lib/                   # Utilities and configs
│   │   ├── db/                # Drizzle ORM schema
│   │   ├── trpc/              # tRPC client and server
│   │   └── utils.ts           # Common utilities
│   │
│   └── server/                # Server logic
│       └── routers/           # tRPC routers
│
├── public/                    # Static files
├── .env.example              # Environment variables example
├── next.config.js            # Next.js configuration
├── tailwind.config.ts        # Tailwind configuration
└── tsconfig.json             # TypeScript configuration
```

## Screenshots

### Register page

![Register page](images/register.png)

### Login page

![Login page](images/login.png)

### Dashboard

![Dashboard](images/dashboard.png)

### Project creating form

![Project creating form](images/project_creating.png)

### Project menu

![Project menu](images/project_menu.png)

### Edit project modal

![Edit project modal](images/edit_project_modal.png)

### Project board

![Project board 1](images/board1.png)
![Project board 2](images/board2.png)

### Project board with activities and tasks

![Project board 3](images/board_with_activities_and_tasks.png)

### Add new column

![Add new column](images/add_new_column.png)

### Task creating

![Task creating](images/task_creating.png)

### Task moving

![Task moving](images/move_task.png)

### Modal for task editing and comments

![Modal for task editing and comments](images/add_comment.png)

### New comment added

![New comment added](images/comment_added.png)

### Reply to new comment added

![Reply to new comment added](images/reply_added.png)

### Tasks priority filters

![Tasks priority filters](images/priority_filter.png)

### Search tasks by title

![Search tasks](images/search_task.png)

### Projects participants list

![Projects participants list](images/participants.png)

### New participant invited

![New participant invited](images/new_participant_added.png)

### New participant role updating

![Role updating](images/update_role.png)

### New participant role updated

![Role updated](images/role_updated.png)

## Key Implementation Features

### Architecture

- **Full-stack type safety** — From database to UI via tRPC and Drizzle
- **Optimistic updates** — Instant UI feedback for drag-and-drop
- **Parallel routes** — Independent section loading
- **Intercepting routes** — Modals as full-fledged pages

### Performance

- **Server Components** — Minimal client-side JavaScript
- **React Query caching** — Smart data invalidation
- **Optimized queries** — Joins and selects via Drizzle

### UX/UI

- **Responsive design** — Works on mobile devices
- **Accessibility** — ARIA labels and keyboard navigation
- **Animations** — Smooth transitions via Tailwind

## Author

**Yulia Vorotintseva**

- **GitHub**: @YuliaVorotintseva
- **Email**: yulia.vorotintseva@gmail.com
