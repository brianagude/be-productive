# Auth + Cloud Tasks Roadmap

## Before writing any code (manual steps)

- [x] **Phase 1a** — Run SQL migrations in Supabase dashboard (tables: todos, completions, tag_colors, global_tags, profiles + trigger)
- [x] **Phase 1b** — Supabase Auth settings: disable "Enable email signups"
- [x] **Phase 1c** — Add `LOOPS_API_KEY` to `.env.local` and Vercel env vars

---

## Code — work through these in order

- [x] **Phase 2** — Fix `src/lib/supabase/middleware.ts` (remove redirect block)
- [x] **Phase 3** — Create `src/middleware.ts` (session refresh wrapper)
- [x] **Phase 4** — Create auth routes: `src/app/auth/confirm/route.ts` + `src/app/auth/set-password/page.tsx`
- [x] **Phase 5** — Create `src/app/api/waitlist/route.ts` (Loops integration)
- [x] **Phase 6** — Create `src/lib/supabase/db.ts` (all DB operations)
- [x] **Phase 7** — Create `src/hooks/useAuth.ts`
- [x] **Phase 8** — Update `src/hooks/useTodos.ts` (add user param + DB sync)
- [x] **Phase 9** — Create `src/components/auth/AuthModal.tsx`
- [x] **Phase 10** — Update `src/components/SiteHeader.tsx` (add user icon)
- [x] **Phase 11** — Update `src/app/page.tsx` (wire everything together)
- [x] **Phase 12** — Update `src/app/stats/page.tsx` (enhanced stats for signed-in users)

---

## Test checklist (after all phases complete)

- [x] Guest path unchanged — todos still load from localStorage
- [x] Waitlist: uninvited email → contact appears in Loops
- [x] Invite flow: admin invite → email → set-password → signed in
- [ ] Forgot password: reset email → set-password → signed in
- [x] Sign in: email + password → signed-in state in modal
- [x] Migration: first sign-in → localStorage todos copied to DB
- [x] Cross-browser: sign in elsewhere → same todos appear
- [ ] No purge: completed tasks not deleted for signed-in users
- [ ] Enhanced stats visible when signed in
- [ ] Sign out → falls back to localStorage
