# Plan: Supabase Auth + Cloud Tasks (Invitation-Only)

## Context

The app stores all tasks in localStorage. Adding optional Supabase-backed accounts lets signed-in users sync tasks across browsers/devices. Auth is invitation-only via email+password — uninvited users see a waitlist panel that captures their email into a Loops mailing list. LocalStorage remains the fallback for guests; nothing about the guest path changes.

Signed-in users also get two behavioral changes:
1. **No data purge** — completed/cancelled todos are never auto-deleted from the DB (guest 7-day purge unchanged)
2. **Richer stats** — the full todo/completion history powers a more detailed stats page

**What exists today:** `@supabase/ssr` and `@supabase/supabase-js` installed. `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `env.local`. Supabase client/server helpers already exist at `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, and `src/lib/supabase/middleware.ts` (the middleware helper currently has a redirect-all block that must be removed). A `UserIcon` at `src/components/icons/UserSquareIcon.tsx`. No actual Next.js middleware file, no auth routes yet.

---

## Architecture

```
User clicks UserIcon → AuthModal
  ├── Sign in view: email + password → signInWithPassword() → session
  │   └── First sign-in? → migrateFromLocalStorage → load from DB
  │       Already migrated? → load from DB
  └── "Need to create an account?" → Waitlist view
        ├── Copy: "Auth is in beta / invitation only"
        ├── Benefits: cross-browser sync, persistent history, richer stats
        └── Email form → POST /api/waitlist → Loops API → "You're on the list!"

Admin invites user:
  Supabase Admin API → invite email → user clicks link → GET /auth/confirm?type=invite
    → token exchange → session → redirect /auth/set-password → user sets password → redirect /

Forgot password:
  AuthModal "Forgot password?" panel → enter email → resetPasswordForEmail()
    → email sent → user clicks link → GET /auth/confirm?type=recovery
    → token exchange → session → redirect /auth/set-password → new password → redirect /

useTodos data flow:
  mount
    ├── no user:  localStorage → runStartupCleanup (with purge) → state
    └── user:     DB fetch → if !migrated → migrate → mark migrated → state
                  runStartupCleanup (without 7-day purge) → state

  mutation
    ├── no user:  state + localStorage (unchanged)
    └── user:     state + Supabase upsert/delete (async, optimistic)
```

---

## Phase 1 — Supabase Database Setup (manual)

Run in the Supabase SQL editor.

```sql
create table todos (
  id           uuid primary key,
  user_id      uuid references auth.users(id) on delete cascade not null,
  title        text not null,
  description  text,
  status       text not null default 'todo',
  priority     text not null default 'none',
  daily        boolean not null default false,
  weekly_days  integer[] not null default '{}',
  backlog      boolean default false,
  tags         text[] not null default '{}',
  deadline     text,
  created_at   timestamptz not null,
  updated_at   timestamptz not null
);
alter table todos enable row level security;
create policy "own todos" on todos for all using (auth.uid() = user_id);

create table completions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  todo_id      text not null,
  title        text not null,
  tags         text[] not null default '{}',
  date         text not null,
  completed_at timestamptz not null
);
alter table completions enable row level security;
create policy "own completions" on completions for all using (auth.uid() = user_id);

create table tag_colors (
  user_id uuid references auth.users(id) on delete cascade not null,
  tag     text not null,
  color   text not null,
  primary key (user_id, tag)
);
alter table tag_colors enable row level security;
create policy "own tag colors" on tag_colors for all using (auth.uid() = user_id);

create table global_tags (
  user_id uuid references auth.users(id) on delete cascade not null,
  tags    text[] not null default '{}',
  primary key (user_id)
);
alter table global_tags enable row level security;
create policy "own global tags" on global_tags for all using (auth.uid() = user_id);

create table profiles (
  user_id   uuid primary key references auth.users(id) on delete cascade,
  migrated  boolean not null default false
);
alter table profiles enable row level security;
create policy "own profile" on profiles for all using (auth.uid() = user_id);

create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id) values (new.id);
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
```

No `waitlist` table — emails go directly to Loops.

**Auth settings:** Dashboard → Auth → Providers → Email → uncheck "Enable email signups". Existing users (invited by admin) can still sign in with email+password.

---

## Phase 2 — Fix Supabase Middleware Helper

**`src/lib/supabase/client.ts`** — already exists, no changes needed.

**`src/lib/supabase/server.ts`** — already exists, no changes needed.

**`src/lib/supabase/middleware.ts`** (modify — remove redirect block)

The current file redirects all unauthenticated users to `/auth/login`. Remove this entire block:

```ts
// DELETE:
if (
  !user &&
  !request.nextUrl.pathname.startsWith('/login') &&
  !request.nextUrl.pathname.startsWith('/auth')
) {
  const url = request.nextUrl.clone()
  url.pathname = '/auth/login'
  return NextResponse.redirect(url)
}
```

The helper should only refresh the session and return — no redirects.

---

## Phase 3 — Next.js Middleware

**`src/middleware.ts`** (new — no existing file)

```ts
import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

---

## Phase 4 — Auth Routes

**`src/app/auth/confirm/route.ts`** (new)

Handles all email link callbacks from Supabase:
```
GET ?token_hash=X&type=...
1. createClient() (server)
2. auth.verifyOtp({ token_hash, type })
3. type === 'invite' or 'recovery' → redirect('/auth/set-password')
   type === 'email'               → redirect('/')
```

**`src/app/auth/set-password/page.tsx`** (new — client component)

A simple full-page form shown after invite acceptance or password reset:
- "Set your password" heading
- Password field + confirm password field
- Submit → `supabase.auth.updateUser({ password })` (client-side, user already has session)
- On success: redirect to `/`
- If no active session (user navigated here directly): redirect to `/`

No login API route needed — `signInWithPassword` runs client-side directly in the AuthModal.

---

## Phase 5 — Waitlist API Route

**`src/app/api/waitlist/route.ts`** (new)

```
POST { email: string }
1. POST https://app.loops.so/api/v1/contacts/create
   { email, source: 'waitlist' }
   Authorization: Bearer LOOPS_API_KEY
2. Return { ok: true }
   (if Loops returns "already exists" error, still return { ok: true })
```

---

## Phase 6 — Supabase DB Functions

**`src/lib/supabase/db.ts`** (new)

All functions take a `SupabaseClient` as first arg. camelCase JS ↔ snake_case DB conversion inside these functions.

```ts
// Todos
fetchTodos(sb, userId): Promise<Todo[]>
upsertTodo(sb, userId, todo: Todo): Promise<void>
deleteTodo(sb, userId, id: string): Promise<void>

// Completions
fetchCompletions(sb, userId): Promise<CompletionRecord[]>
addCompletion(sb, userId, record: CompletionRecord): Promise<void>

// Tag colors
fetchTagColors(sb, userId): Promise<Record<string, string>>
upsertTagColor(sb, userId, tag: string, color: string): Promise<void>
deleteTagColor(sb, userId, tag: string): Promise<void>

// Global tags
fetchGlobalTags(sb, userId): Promise<string[]>
saveGlobalTags(sb, userId, tags: string[]): Promise<void>

// Profile / migration
isMigrated(sb, userId): Promise<boolean>
migrateFromLocalStorage(sb, userId): Promise<void>
  // Reads STORAGE_KEY, TAGS_KEY, TAG_COLORS_KEY, COMPLETIONS_KEY from localStorage
  // Batch-upserts everything to DB
  // Sets profiles.migrated = true
  // Does NOT clear localStorage
```

---

## Phase 7 — useAuth Hook

**`src/hooks/useAuth.ts`** (new)

```ts
// Returns { user: User | null, loading: boolean, signOut: () => void }
// Uses createClient() from src/lib/supabase/client.ts
// Calls supabase.auth.getUser() on mount
// Subscribes to supabase.auth.onAuthStateChange for sign-in/out events
```

---

## Phase 8 — Update useTodos

**`src/hooks/useTodos.ts`** (modify)

Signature change:
```ts
export function useTodos(user: User | null = null)
```

**Init**: Guest path unchanged. With `user`: check `isMigrated` → migrate if needed → `fetchTodos` → setState. Then run `runStartupCleanup` with the loaded data.

**`runStartupCleanup` split**: The 7-day purge step is conditional on `!user`:
```ts
if (!user) {
  // purge done/cancelled todos older than 7 days
}
// daily/weekly reset logic runs for everyone
```

**`persist` (todos write)**: Use a `todosRef = useRef<Todo[]>([])` updated on every state change. Callbacks read from `todosRef.current` instead of `getTodos()` — avoids stale closures without adding `todos` to every dep array.

```ts
const persist = useCallback((updated: Todo[]) => {
  setTodos(updated)
  todosRef.current = updated
  if (!user) saveTodos(updated)          // guest: localStorage
  else { /* fire-and-forget upserts */ } // cloud: DB
}, [user])
```

For `addTodo`: `persist([...todosRef.current, todo])`
For `updateTodo`: `persist(todosRef.current.map(t => ...))`
For `deleteTodo`: calls `deleteTodo(sb, userId, id)` for cloud users

**Tag/color operations**: When `user` is present, call `saveGlobalTags` / `upsertTagColor` from `src/lib/supabase/db.ts` instead of the localStorage versions.

**`cycleStatus` / `addCompletion`**: When `user` is present, call `addCompletion(sb, userId, record)` from db.ts instead of `addCompletion` from storage.ts.

---

## Phase 9 — AuthModal Component

**`src/components/auth/AuthModal.tsx`** (new)

Uses existing `Dialog` from `src/components/ui/dialog.tsx` and `Input` from `src/components/ui/input.tsx`.

Three panels, toggled by local state:

**Panel A — Login** (default):
- Title: "Sign in"
- Email field + Password field
- "Sign in" button → `supabase.auth.signInWithPassword({ email, password })`
- Error state: show error message inline
- "Forgot password?" link → Panel C
- "Need to create an account? →" link → Panel B

**Panel B — Waitlist**:
- Title: "Join the waitlist"
- Copy: "Auth is currently in beta and available by invitation only. Leave your email and we'll reach out when spots open."
- Benefits: sync across browsers, persistent history, richer stats
- Email field + "Join waitlist" → `POST /api/waitlist`
- States: idle → loading → success ("You're on the list!")
- "← Back to sign in" link

**Panel C — Forgot password**:
- Title: "Reset your password"
- Email field
- "Send reset link" → `supabase.auth.resetPasswordForEmail(email, { redirectTo: origin + '/auth/confirm' })`
- Success: "Check your email for a reset link"
- "← Back to sign in" link

**Signed-in panel** (when `user !== null`):
- Shows `user.email`
- "Sign out" button → calls `signOut()` from `useAuth`

Props:
```ts
interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
  onSignOut: () => void
}
```

---

## Phase 10 — SiteHeader

**`src/components/SiteHeader.tsx`** (modify)

Add props:
```ts
user?: User | null
onAccountClick?: () => void
```

Reuse existing `UserIcon` from `src/components/icons/UserSquareIcon.tsx`.

Desktop nav: add `UserIcon` button between "Timer" and "New task". When `user !== null`, style as `text-foreground` (vs `text-muted-foreground` when signed out).

Mobile dropdown: add "Account" row using the same `menuRowCls` pattern as existing rows.

---

## Phase 11 — Wire Up in page.tsx

**`src/app/page.tsx`** (modify)

```ts
const { user, loading, signOut } = useAuth()
const { todos, ... } = useTodos(user)
const [authOpen, setAuthOpen] = useState(false)
```

Pass `user` and `onAccountClick={() => setAuthOpen(true)}` to `SiteHeader`.
Render `<AuthModal open={authOpen} onOpenChange={setAuthOpen} user={user} onSignOut={signOut} />`.

No loading spinner needed — localStorage data is available immediately; DB data replaces it once loaded.

---

## Phase 12 — Enhanced Stats for Signed-In Users

**`src/app/stats/page.tsx`** (modify)

When `user` is present, read from the DB instead of localStorage and render additional panels.

**Changes:**
- Use `useAuth()` to get the user
- Data source: `fetchTodos(sb, userId)` + `fetchCompletions(sb, userId)` from db.ts
- Extract `compute()` to accept pre-loaded data so it works for both guest and cloud users

**New panels (signed-in only, appended after existing panels):**

1. **Completion log** — scrollable list of the 50 most-recent completions: date, title, tags
2. **Completions by category — all time** — horizontal bar chart per tag
3. **Day-of-week breakdown** — bar chart (Mon–Sun) showing typical completion days
4. **Monthly trend** — bar chart of completions per month over the past 12 months
5. **Recurring task rate** — for `daily`/`weeklyDays` todos, % of scheduled days with a completion
6. **Priority breakdown** — grouped bar of completions by priority level

Guest stats page is unchanged.

---

## Environment Variables

```
# Already present:
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...

# Add to .env.local AND Vercel:
LOOPS_API_KEY=...
```

No service role key needed — waitlist goes to Loops, all DB ops use the anon key with RLS.

---

## File Summary

| File | Action |
|------|--------|
| `src/lib/supabase/client.ts` | No change (already exists) |
| `src/lib/supabase/server.ts` | No change (already exists) |
| `src/lib/supabase/middleware.ts` | Modify — remove redirect block |
| `src/lib/supabase/db.ts` | Create — all DB operations |
| `src/middleware.ts` | Create — session refresh wrapper |
| `src/hooks/useAuth.ts` | Create — auth state hook |
| `src/app/auth/confirm/route.ts` | Create — token exchange callback |
| `src/app/auth/set-password/page.tsx` | Create — password form after invite/reset |
| `src/app/api/waitlist/route.ts` | Create — Loops email capture |
| `src/components/auth/AuthModal.tsx` | Create — login + waitlist + forgot-password |
| `src/hooks/useTodos.ts` | Modify — add user param + DB sync |
| `src/components/SiteHeader.tsx` | Modify — add UserIcon + onAccountClick |
| `src/app/page.tsx` | Modify — wire useAuth + AuthModal |
| `src/app/stats/page.tsx` | Modify — DB data source + enhanced panels |

**Reused without changes:**
- `src/components/icons/UserSquareIcon.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/input.tsx`
- `src/lib/storage.ts`

---

## Verification Checklist

- [ ] Guest path: todos load from localStorage, all interactions work, nothing changed
- [ ] Waitlist: uninvited email → contact appears in Loops dashboard
- [ ] Invite flow: admin invite → email → `/auth/confirm?type=invite` → set-password → signed in
- [ ] Forgot password: reset email → `/auth/confirm?type=recovery` → set-password → signed in
- [ ] Sign in: email + password → signed-in state in modal
- [ ] Migration: first sign-in → localStorage todos in DB, `profiles.migrated = true`
- [ ] Cross-browser: sign in elsewhere → same todos appear
- [ ] No purge: completed tasks not deleted for signed-in users after 7 days
- [ ] Enhanced stats visible and DB-sourced when signed in
- [ ] Sign out → falls back to localStorage
