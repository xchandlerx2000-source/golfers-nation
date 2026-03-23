# Supabase setup for Golfers Nation

Golfers Nation now supports a real tester flow with:

- email sign-up
- email sign-in
- session restore
- sign-out
- password reset email scaffold
- cloud-backed profile and workspace persistence
- live round session discovery by invite code
- Supabase Realtime round broadcasts across joined devices

## Environment variables

Set these in [runtime-config.js](C:/Users/Bower/OneDrive/Desktop/golf%20nation/runtime-config.js) before building the tester deploy:

- `supabaseUrl` defaults to `https://jsvxckzbymbdilyujjko.supabase.co`
- `supabaseAnonKey`
- `supabaseResetRedirectUrl`
- `siteUrl`

The build copies [runtime-config.js](C:/Users/Bower/OneDrive/Desktop/golf%20nation/runtime-config.js) into the deploy package unchanged.

## Recommended Supabase auth settings

- Enable Email auth
- For tester builds, disable email confirmation if you want brand-new accounts to enter the app immediately after sign-up
- Add your deployed site URL to the allowed redirect URLs for password reset

## Suggested SQL schema

```sql
create table if not exists public.player_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  profile_id text,
  display_name text not null,
  username text not null,
  email text not null,
  provider text default 'email',
  avatar_label text default 'GN',
  avatar_url text,
  city text,
  home_course text,
  handicap numeric,
  bio text default '',
  season_goal text default '',
  subscription_tier text default 'free',
  subscription_status text default 'active',
  billing_ready boolean default false,
  rounds_played integer default 0,
  average_score numeric,
  best_round integer,
  recent_form_summary text default 'First round pending',
  privacy jsonb default '{}'::jsonb,
  appearance jsonb default '{}'::jsonb,
  social_settings jsonb default '{}'::jsonb,
  seeded_demo boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.player_workspaces (
  user_id uuid primary key references auth.users (id) on delete cascade,
  workspace jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

create table if not exists public.tester_feedback (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  tester_name text,
  email text,
  feedback_area text default 'other',
  rating integer default 3,
  feedback_message text not null,
  app_version text,
  plan_tier text,
  install_state text,
  appearance_mode text,
  theme_id text,
  context_view text,
  recent_activity text,
  user_agent text,
  created_at timestamptz default now()
);

create table if not exists public.live_round_sessions (
  id text primary key,
  invite_code text not null unique,
  round_id text not null,
  host_user_id uuid references auth.users (id) on delete cascade,
  updated_by_user_id uuid references auth.users (id) on delete set null,
  course_name text not null,
  mode text not null default 'stroke',
  status text not null default 'hosting',
  round_state jsonb not null default '{}'::jsonb,
  group_state jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## Suggested row-level security

```sql
alter table public.player_profiles enable row level security;
alter table public.player_workspaces enable row level security;
alter table public.tester_feedback enable row level security;
alter table public.live_round_sessions enable row level security;

create policy "profiles owner read"
on public.player_profiles
for select
using (auth.uid() = id);

create policy "profiles owner write"
on public.player_profiles
for all
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "workspaces owner read"
on public.player_workspaces
for select
using (auth.uid() = user_id);

create policy "workspaces owner write"
on public.player_workspaces
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "feedback owner read"
on public.tester_feedback
for select
using (auth.uid() = user_id);

create policy "feedback owner insert"
on public.tester_feedback
for insert
with check (auth.uid() = user_id);

create policy "live sessions authenticated read"
on public.live_round_sessions
for select
using (auth.role() = 'authenticated');

create policy "live sessions authenticated write"
on public.live_round_sessions
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');
```

## Realtime notes

- Golfers Nation uses the `live_round_sessions` table to discover hosted rounds by invite code.
- Live score changes then move through Supabase Realtime channels keyed by the invite code.
- This policy set is intentionally tester-friendly so any authenticated golfer with the code can join the shared round.
- Before public launch, tighten these policies so only invited participants can read and update a live round session.
- If Supabase Realtime public access is disabled in your project, also add authenticated Realtime policies:

```sql
create policy "authenticated can receive realtime broadcasts"
on "realtime"."messages"
for select
to authenticated
using (true);

create policy "authenticated can send realtime broadcasts"
on "realtime"."messages"
for insert
to authenticated
with check (true);
```

- If you prefer public tester channels, keep Supabase Realtime "Allow public access" enabled.

## What is real now

- Supabase email auth
- per-user cloud profile row
- per-user cloud workspace row
- per-user tester feedback notes
- live invite-code round sessions
- Supabase Realtime broadcast updates between joined devices
- session restore from stored auth session
- password reset email request

## What remains mocked

- Google and Apple sign-in buttons still act as review/demo fallbacks
- premium billing is still mocked

## Course testing note

The featured local test course is:

- The Country Club at Golden Nugget
- Lake Charles, Louisiana

Its seeded hole and tee data is based on the official Golden Nugget course tour page.
