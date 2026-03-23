# Supabase setup for Golfers Nation

Golfers Nation now supports a real tester flow with:

- email sign-up
- email sign-in
- session restore
- sign-out
- password reset email scaffold
- cloud-backed profile and workspace persistence

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
```

## Suggested row-level security

```sql
alter table public.player_profiles enable row level security;
alter table public.player_workspaces enable row level security;
alter table public.tester_feedback enable row level security;

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
```

## What is real now

- Supabase email auth
- per-user cloud profile row
- per-user cloud workspace row
- per-user tester feedback notes
- session restore from stored auth session
- password reset email request

## What remains mocked

- Google and Apple sign-in buttons still act as review/demo fallbacks
- realtime live round sync is still local/device based
- premium billing is still mocked

## Course testing note

The featured local test course is:

- The Country Club at Golden Nugget
- Lake Charles, Louisiana

Its seeded hole and tee data is based on the official Golden Nugget course tour page.
