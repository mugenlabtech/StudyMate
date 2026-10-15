-- Apply after 0001. Client may read own records but may not mint quota or usage events.
create table if not exists public.ai_usage_events(id uuid primary key default gen_random_uuid(),owner_id uuid not null references auth.users(id) on delete cascade,course_id uuid references public.courses(id) on delete set null,feature text not null,model text not null,status text not null check(status in ('reserved','success','failed')),prompt_tokens integer,completion_tokens integer,duration_ms integer,error_code text,created_at timestamptz not null default now());
create index if not exists ai_usage_owner_day on public.ai_usage_events(owner_id,created_at desc);
create table if not exists public.ai_conversations(id uuid primary key default gen_random_uuid(),owner_id uuid not null references auth.users(id) on delete cascade,course_id uuid not null references public.courses(id) on delete cascade,title text,created_at timestamptz not null default now());
create table if not exists public.ai_messages(id uuid primary key default gen_random_uuid(),owner_id uuid not null references auth.users(id) on delete cascade,conversation_id uuid not null references public.ai_conversations(id) on delete cascade,role text not null check(role in ('user','assistant')),content text not null,created_at timestamptz not null default now());
alter table public.ai_usage_events enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
create policy ai_usage_read on public.ai_usage_events for select to authenticated using(owner_id=auth.uid());
create policy ai_conversations_owner on public.ai_conversations for all to authenticated using(owner_id=auth.uid() and exists(select 1 from public.courses c where c.id=course_id and c.owner_id=auth.uid())) with check(owner_id=auth.uid() and exists(select 1 from public.courses c where c.id=course_id and c.owner_id=auth.uid()));
create policy ai_messages_read on public.ai_messages for select to authenticated using(owner_id=auth.uid() and exists(select 1 from public.ai_conversations c where c.id=conversation_id and c.owner_id=auth.uid()));
-- Atomic reservation via invoker-authenticated RPC. Counts reservations even on failures to prevent free-tier abuse.
create or replace function public.reserve_ai_request(p_owner uuid,p_limit integer) returns boolean language plpgsql security definer set search_path = public as $$
declare used integer;
begin
 if auth.uid() is null or auth.uid() <> p_owner then raise exception 'unauthorized';end if;
 if p_limit < 1 or p_limit > 1000 then raise exception 'invalid quota';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_owner::text,0));
 select count(*) into used from public.ai_usage_events where owner_id=p_owner and created_at >= date_trunc('day',now() at time zone 'Africa/Lagos') at time zone 'Africa/Lagos' and status='reserved';
 if used>=p_limit then return false;end if;
 insert into public.ai_usage_events(owner_id,feature,model,status) values(p_owner,'quota_reservation','none','reserved');return true;
end $$;
revoke all on function public.reserve_ai_request(uuid,integer) from public;
grant execute on function public.reserve_ai_request(uuid,integer) to authenticated;

-- Authenticated, restricted usage logging without granting client INSERT on usage events.
create or replace function public.log_ai_request(p_course uuid,p_feature text,p_model text,p_status text,p_duration integer,p_prompt_tokens integer,p_completion_tokens integer,p_error_code text) returns void language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is null or not exists(select 1 from public.courses where id=p_course and owner_id=auth.uid()) then raise exception 'unauthorized';end if;
 if p_status not in ('success','failed') or length(p_feature)>64 or length(p_model)>128 then raise exception 'invalid log';end if;
 insert into public.ai_usage_events(owner_id,course_id,feature,model,status,duration_ms,prompt_tokens,completion_tokens,error_code) values(auth.uid(),p_course,p_feature,p_model,p_status,p_duration,p_prompt_tokens,p_completion_tokens,p_error_code);
end $$;
revoke all on function public.log_ai_request(uuid,text,text,text,integer,integer,integer,text) from public;
grant execute on function public.log_ai_request(uuid,text,text,text,integer,integer,integer,text) to authenticated;
