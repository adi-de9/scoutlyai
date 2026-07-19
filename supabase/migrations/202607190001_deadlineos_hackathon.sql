-- DeadlineOS hackathon: private notice processing and user-owned planning data.
create extension if not exists pgcrypto;
create extension if not exists pgmq;

create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  source_type text not null check (source_type in ('text', 'image', 'pdf', 'demo')),
  source_name text,
  source_mime_type text,
  source_size integer,
  source_path text,
  raw_text text,
  status text not null default 'queued' check (status in ('queued', 'analyzed', 'planned', 'failed', 'demo')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.analysis_jobs (
  id uuid primary key default gen_random_uuid(),
  notice_id uuid not null references public.notices(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued', 'reading', 'extracting', 'planning', 'awaiting_approval', 'completed', 'failed', 'demo_fallback')),
  progress smallint not null default 0 check (progress between 0 and 100),
  attempts smallint not null default 0,
  error_code text,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  notice_id uuid not null unique references public.notices(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  deadline_at timestamptz,
  priority text not null check (priority in ('low', 'medium', 'high')),
  confidence numeric(4,3) not null check (confidence between 0 and 1),
  extraction jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deadlines (
  id uuid primary key default gen_random_uuid(),
  notice_id uuid not null references public.notices(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  deadline_at timestamptz not null,
  priority text not null check (priority in ('low', 'medium', 'high')),
  status text not null default 'active' check (status in ('active', 'complete')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  deadline_id uuid not null references public.deadlines(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  scheduled_at timestamptz not null,
  estimated_minutes integer not null default 30,
  priority text not null check (priority in ('low', 'medium', 'high')),
  status text not null default 'pending' check (status in ('pending', 'done', 'blocked')),
  required_document text,
  blocker_reason text,
  completed_at timestamptz,
  postponed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  scheduled_at timestamptz not null,
  status text not null default 'proposed' check (status in ('proposed', 'approved', 'scheduled', 'cancelled')),
  notification_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  event_type text not null check (event_type in ('analyzed', 'plan_approved', 'reminder_approved', 'done', 'later', 'blocked', 'blocker_recovered')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analysis_jobs_user_status_idx on public.analysis_jobs (user_id, status, updated_at desc);
create index if not exists notices_user_created_idx on public.notices (user_id, created_at desc);
create index if not exists deadlines_user_deadline_idx on public.deadlines (user_id, deadline_at);
create index if not exists tasks_user_status_idx on public.tasks (user_id, status, scheduled_at);
create index if not exists reminders_user_status_idx on public.reminders (user_id, status, scheduled_at);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;

drop trigger if exists notices_set_updated_at on public.notices;
create trigger notices_set_updated_at before update on public.notices for each row execute function public.set_updated_at();
drop trigger if exists analysis_jobs_set_updated_at on public.analysis_jobs;
create trigger analysis_jobs_set_updated_at before update on public.analysis_jobs for each row execute function public.set_updated_at();
drop trigger if exists analyses_set_updated_at on public.analyses;
create trigger analyses_set_updated_at before update on public.analyses for each row execute function public.set_updated_at();
drop trigger if exists deadlines_set_updated_at on public.deadlines;
create trigger deadlines_set_updated_at before update on public.deadlines for each row execute function public.set_updated_at();
drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at before update on public.tasks for each row execute function public.set_updated_at();
drop trigger if exists reminders_set_updated_at on public.reminders;
create trigger reminders_set_updated_at before update on public.reminders for each row execute function public.set_updated_at();

alter table public.notices enable row level security;
alter table public.analysis_jobs enable row level security;
alter table public.analyses enable row level security;
alter table public.deadlines enable row level security;
alter table public.tasks enable row level security;
alter table public.reminders enable row level security;
alter table public.activity_events enable row level security;

create policy "notice owner" on public.notices for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "job owner" on public.analysis_jobs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "analysis owner" on public.analyses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "deadline owner" on public.deadlines for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "task owner" on public.tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "reminder owner" on public.reminders for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "activity owner" on public.activity_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('notice-source', 'notice-source', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "private notice upload" on storage.objects for insert to authenticated with check (
  bucket_id = 'notice-source' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "private notice read" on storage.objects for select to authenticated using (
  bucket_id = 'notice-source' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "private notice delete" on storage.objects for delete to authenticated using (
  bucket_id = 'notice-source' and (storage.foldername(name))[1] = auth.uid()::text
);

select pgmq.create('analysis_jobs_queue') where not exists (
  select 1 from pgmq.list_queues() where queue_name = 'analysis_jobs_queue'
);

create or replace function public.enqueue_analysis_job(job_id uuid)
returns bigint language sql security definer set search_path = pgmq, public as $$
  select pgmq.send('analysis_jobs_queue', jsonb_build_object('job_id', job_id));
$$;
revoke all on function public.enqueue_analysis_job(uuid) from public;
grant execute on function public.enqueue_analysis_job(uuid) to service_role;
