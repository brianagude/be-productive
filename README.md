# Be Productive

A personal productivity app with task management, a Pomodoro timer, and stats tracking. Built by [Briana Gude](https://www.brianagude.com).

**Live:** [be-productive.brianagude.com](https://be-productive.brianagude.com)

## What it does

Be Productive is a no-friction task manager centered around focused work sessions. You build a list of tasks, run timed work sessions against them, and track how you're doing over time.

**Tasks**

- Create tasks with a title, description, priority (urgent → none), deadline, and color-coded tags
- Cycle status with a single click: `todo → in progress → done → cancelled`
- Organize into sections: **Daily** (auto-resets each day), **Weekly** (recurs on chosen days), **Tasks**, and **Backlog** (hidden until you need it)
- Drag tasks between sections to re-categorize them
- Collapse/expand sections to stay focused

**Pomodoro timer**

- Link a timer session to any active task
- Configurable work and break lengths
- Audio cues at session end, ambient chime at the 1-minute break warning
- Browser notifications when phases switch
- Countdown shown in the browser tab title while running
- Time logged per task and used in stats

**Stats page (`/stats`)**

- Full-year completion heatmap (GitHub-style)
- Completions today and this week
- Time spent today and this week, broken down by tag
- Streak tracking for focus sessions and completions

**Changelog (`/changelog`)**

- Running list of what's changed in the app

## Pages

| Route        | What's there           |
| ------------ | ---------------------- |
| `/`          | Main task list         |
| `/stats`     | Productivity dashboard |
| `/changelog` | Release notes          |

## Running locally

```bash
pnpm install
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other commands:

```bash
pnpm run build   # production build
pnpm run start   # serve the production build
pnpm run lint    # lint
```

## Tech stack

| Layer      | What                                            |
| ---------- | ----------------------------------------------- |
| Framework  | Next.js 16 (App Router), React 19               |
| Language   | TypeScript                                      |
| Styling    | Tailwind CSS v4, shadcn/ui (Base UI primitives) |
| Icons      | Phosphor Icons                                  |
| Date utils | date-fns, react-day-picker                      |
| Storage    | `localStorage` (no backend currently)           |
| Analytics  | PostHog                                         |

## Project structure

```
src/
  app/
    page.tsx              # Main task list
    layout.tsx            # Root layout, metadata, fonts
    stats/page.tsx        # Productivity stats dashboard
    changelog/page.tsx    # Release notes
    sitemap.ts            # Auto-generated sitemap
    robots.ts             # robots.txt
  components/
    SiteHeader.tsx        # Nav header with timer trigger
    SiteFooter.tsx        # Footer with page links
    todo/                 # TodoList, TodoItem, modals, Pomodoro, StatusButton
    ui/                   # shadcn primitives (button, dialog, badge, etc.)
  hooks/
    useTodos.ts           # CRUD + localStorage persistence
    usePomodoro.ts        # Pomodoro timer state and audio
  lib/
    types.ts              # Todo type, Priority, Status, tag palette
    storage.ts            # localStorage helpers, startup cleanup
    pomodoroStorage.ts    # Pomodoro session + settings storage
    dates.ts              # Relative deadline formatting
    utils.ts              # cn()
```

## Roadmap

- **Auth** — user accounts so data follows you across devices
- **Database** — backend storage to replace localStorage (the app has real users now)
