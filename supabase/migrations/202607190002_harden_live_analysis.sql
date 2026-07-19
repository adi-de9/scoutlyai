-- Keep costly Gemini work bounded even if a client is modified or automated.
alter table public.notices
  add constraint notices_source_size_bounds
  check (source_size is null or (source_size >= 0 and source_size <= 10485760)) not valid;

alter table public.notices
  add constraint notices_text_source_bounds
  check (
    source_type <> 'text'
    or (source_size <= 50000 and char_length(coalesce(raw_text, '')) between 1 and 50000)
  ) not valid;

create table if not exists public.ai_quota_windows (
  user_id uuid not null references auth.users(id) on delete cascade,
  request_kind text not null check (request_kind in ('analysis', 'blocker')),
  window_start timestamptz not null,
  request_count smallint not null default 0 check (request_count >= 0),
  primary key (user_id, request_kind, window_start)
);

alter table public.ai_quota_windows enable row level security;

create or replace function public.consume_ai_quota(
  p_user_id uuid,
  p_request_kind text,
  p_max_requests smallint,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  bucket_start timestamptz;
  updated_count smallint;
begin
  if p_user_id is null or p_request_kind not in ('analysis', 'blocker')
    or p_max_requests < 1 or p_window_seconds < 1 then
    raise exception 'Invalid AI quota request';
  end if;

  bucket_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );
  insert into public.ai_quota_windows (user_id, request_kind, window_start, request_count)
  values (p_user_id, p_request_kind, bucket_start, 1)
  on conflict (user_id, request_kind, window_start) do update
    set request_count = public.ai_quota_windows.request_count + 1
    where public.ai_quota_windows.request_count < p_max_requests
  returning request_count into updated_count;

  return updated_count is not null;
end;
$$;

revoke all on function public.consume_ai_quota(uuid, text, smallint, integer) from public;
grant execute on function public.consume_ai_quota(uuid, text, smallint, integer) to service_role;

-- Delete the private Storage object if its notice is later deleted.
create or replace function public.delete_notice_source()
returns trigger
language plpgsql
security definer
set search_path = public, storage
as $$
begin
  if old.source_path is not null then
    delete from storage.objects
    where bucket_id = 'notice-source' and name = old.source_path;
  end if;
  return old;
end;
$$;

drop trigger if exists notices_delete_private_source on public.notices;
create trigger notices_delete_private_source
after delete on public.notices
for each row execute function public.delete_notice_source();
