-- StudyMate admin academic catalogue and financial ledger foundation.
-- Run once in Supabase SQL Editor. No public table writes are granted.
create extension if not exists pgcrypto;
create table if not exists public.academic_institutions(id uuid primary key default gen_random_uuid(),name text not null,short_name text,type text default 'university',state text,status text not null default 'active' check(status in ('active','inactive')),created_at timestamptz not null default now());
create unique index if not exists academic_institution_name_idx on public.academic_institutions(lower(name));
create table if not exists public.academic_faculties(id uuid primary key default gen_random_uuid(),institution_id uuid not null references public.academic_institutions(id) on delete cascade,name text not null,created_at timestamptz default now(),unique(institution_id,name));
create table if not exists public.academic_departments(id uuid primary key default gen_random_uuid(),faculty_id uuid not null references public.academic_faculties(id) on delete cascade,name text not null,created_at timestamptz default now(),unique(faculty_id,name));
create table if not exists public.academic_courses(id uuid primary key default gen_random_uuid(),institution_id uuid not null references public.academic_institutions(id) on delete cascade,department_id uuid references public.academic_departments(id) on delete set null,code text not null,title text not null,level integer,semester text,status text not null default 'approved' check(status in ('approved','pending','archived')),created_at timestamptz default now(),unique(institution_id,code));
create index if not exists academic_courses_lookup_idx on public.academic_courses(institution_id,code);
create table if not exists public.academic_papers(id uuid primary key default gen_random_uuid(),institution_id uuid not null references public.academic_institutions(id),course_id uuid not null references public.academic_courses(id),year integer,session text,semester text,exam_type text,storage_path text not null unique,file_hash text,original_name text,status text not null default 'pending' check(status in ('pending','approved','rejected')),uploaded_by uuid references auth.users(id),created_at timestamptz default now());
create unique index if not exists academic_papers_dedup_idx on public.academic_papers(course_id,file_hash) where file_hash is not null;
create table if not exists public.academic_questions(id uuid primary key default gen_random_uuid(),paper_id uuid references public.academic_papers(id) on delete set null,course_id uuid not null references public.academic_courses(id),body text not null,answer text,options jsonb,topic text,difficulty text,question_type text,year integer,status text not null default 'pending' check(status in ('pending','approved','rejected')),created_at timestamptz default now());
create index if not exists academic_questions_course_idx on public.academic_questions(course_id,status);
create table if not exists public.admin_expenses(id uuid primary key default gen_random_uuid(),amount numeric(14,2) not null check(amount>0),currency text not null default 'NGN',category text not null,description text,spent_at timestamptz not null default now(),created_at timestamptz default now());
create table if not exists public.admin_payments(id uuid primary key default gen_random_uuid(),user_id uuid references auth.users(id),amount numeric(14,2) not null check(amount>=0),currency text not null default 'NGN',status text not null default 'pending' check(status in ('pending','paid','failed','refunded')),provider text,provider_reference text unique,created_at timestamptz default now());
create table if not exists public.admin_audit_logs(id uuid primary key default gen_random_uuid(),actor_id uuid not null references auth.users(id),action text not null,target text not null,details jsonb not null default '{}'::jsonb,created_at timestamptz default now());
create index if not exists admin_audit_recent_idx on public.admin_audit_logs(created_at desc);
-- RLS: the admin API uses the service-role client only after verifying a real Supabase session and an email allowlist.
do $$ declare t text; begin foreach t in array array['academic_institutions','academic_faculties','academic_departments','academic_courses','academic_papers','academic_questions','admin_expenses','admin_payments','admin_audit_logs'] loop execute format('alter table public.%I enable row level security',t); end loop; end $$;
-- Students may read approved institution/course catalogue, but never admin finance, papers or private questions.
create policy "catalogue institutions" on public.academic_institutions for select to authenticated using (status='active');
create policy "catalogue courses" on public.academic_courses for select to authenticated using (status='approved');
-- Storage bucket is private; admin service-role access only.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('academic-papers','academic-papers',false,5242880,array['application/pdf','text/plain','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict(id) do nothing;
