create table if not exists public.tee_time_requests (
  id text primary key,
  course_id text not null,
  course_name text not null default '',
  requester_user_id uuid references auth.users (id) on delete cascade,
  requester_profile_id text,
  round_id text,
  request_mode text not null default 'request',
  provider text not null default '',
  desired_window_label text not null default 'Next available',
  requested_at timestamptz not null default now(),
  status text not null default 'requested',
  notes text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.course_service_requests (
  id text primary key,
  course_id text not null,
  course_name text not null default '',
  round_id text,
  requester_user_id uuid references auth.users (id) on delete cascade,
  requester_profile_id text,
  request_type text not null default 'guest-services',
  requested_at timestamptz not null default now(),
  status text not null default 'requested',
  notes text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists tee_time_requests_requester_user_id_idx
on public.tee_time_requests (requester_user_id, requested_at desc);

create index if not exists tee_time_requests_course_id_idx
on public.tee_time_requests (course_id);

create index if not exists course_service_requests_requester_user_id_idx
on public.course_service_requests (requester_user_id, requested_at desc);

create index if not exists course_service_requests_course_id_idx
on public.course_service_requests (course_id);

alter table public.tee_time_requests enable row level security;
alter table public.course_service_requests enable row level security;

drop policy if exists "tee time requests owner read" on public.tee_time_requests;
create policy "tee time requests owner read"
on public.tee_time_requests
for select
using (auth.uid() = requester_user_id);

drop policy if exists "tee time requests owner insert" on public.tee_time_requests;
create policy "tee time requests owner insert"
on public.tee_time_requests
for insert
with check (auth.uid() = requester_user_id);

drop policy if exists "tee time requests owner update" on public.tee_time_requests;
create policy "tee time requests owner update"
on public.tee_time_requests
for update
using (auth.uid() = requester_user_id)
with check (auth.uid() = requester_user_id);

drop policy if exists "course service requests owner read" on public.course_service_requests;
create policy "course service requests owner read"
on public.course_service_requests
for select
using (auth.uid() = requester_user_id);

drop policy if exists "course service requests owner insert" on public.course_service_requests;
create policy "course service requests owner insert"
on public.course_service_requests
for insert
with check (auth.uid() = requester_user_id);

drop policy if exists "course service requests owner update" on public.course_service_requests;
create policy "course service requests owner update"
on public.course_service_requests
for update
using (auth.uid() = requester_user_id)
with check (auth.uid() = requester_user_id);

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tee_time_requests_set_updated_at on public.tee_time_requests;
create trigger tee_time_requests_set_updated_at
before update on public.tee_time_requests
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists course_service_requests_set_updated_at on public.course_service_requests;
create trigger course_service_requests_set_updated_at
before update on public.course_service_requests
for each row
execute function public.set_updated_at_timestamp();
