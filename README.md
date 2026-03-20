# Be Productive

A simple task management app to help you track and improve your productivity. Built by [Briana Gude](https://www.brianagude.com).

## Features

- Create tasks with priorities, tags, deadlines, and descriptions
- Mark tasks as daily habits that reset each day
- Cycle task status (todo → in progress → done / cancelled)
- Pomodoro timer with task linking
- Productivity stats page

## Tech Stack

- **Framework**: Next.js (App Router)
- **UI**: shadcn/ui (Base UI) + Tailwind CSS
- **Icons**: Phosphor Icons (duotone)
- **Font**: Spline Sans
- **Storage**: localStorage (no backend)
- **Language**: TypeScript

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
  app/
    page.tsx          # Main task list
    layout.tsx        # Root layout, metadata, fonts
    stats/
      page.tsx        # Productivity stats
    sitemap.ts        # Auto-generated sitemap
    robots.ts         # robots.txt
  components/
    todo/             # TodoList, TodoItem, TodoModal, StatusButton, Pomodoro
    ui/               # shadcn primitives
  hooks/
    useTodos.ts       # CRUD + localStorage persistence
    usePomodoro.ts    # Pomodoro timer logic
  lib/
    types.ts          # Todo types, tag palette
    storage.ts        # localStorage helpers, startup cleanup
    pomodoroStorage.ts# Pomodoro session storage
    dates.ts          # Relative deadline formatting
    utils.ts          # cn()
```
