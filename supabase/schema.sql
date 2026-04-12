-- ============================================
--  KRIYA — Supabase Postgres Schema
-- ============================================

-- 1. PROFILES (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  industry text,
  sub_industry text,
  experience integer,
  skills text[] default '{}',
  bio text,
  onboarded boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. MISSIONS
create table if not exists public.missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null default '',
  target_role text,
  target_company text,
  status text not null default 'active' check (status in ('active','paused','completed','abandoned')),
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_missions_user on public.missions(user_id);

-- 3. TASKS
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  mission_id uuid references public.missions(id) on delete set null,
  title text not null,
  description text not null default '',
  status text not null default 'pending' check (status in ('pending','in_progress','completed','skipped')),
  priority text not null default 'medium' check (priority in ('low','medium','high','critical')),
  due_date date,
  completed_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists idx_tasks_user on public.tasks(user_id);
create index if not exists idx_tasks_mission on public.tasks(mission_id);

-- 4. RESUMES
create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade unique,
  content text not null default '',
  ats_score integer,
  ats_analysis jsonb,
  updated_at timestamptz default now()
);

-- 5. HIREABILITY SCORES
create table if not exists public.hireability_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  score integer not null check (score >= 0 and score <= 100),
  breakdown jsonb not null default '{}',
  computed_at timestamptz default now()
);
create index if not exists idx_hireability_user on public.hireability_scores(user_id);

-- 6. AI SESSIONS
create table if not exists public.ai_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_type text not null check (session_type in ('mission','skill_gap','resume','interview','roadmap','tasks')),
  prompt_summary text not null default '',
  response_summary text not null default '',
  metadata jsonb default '{}',
  created_at timestamptz default now()
);
create index if not exists idx_ai_sessions_user on public.ai_sessions(user_id);

-- 7. INTERVIEW LOGS
create table if not exists public.interview_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  quiz_score numeric not null,
  questions jsonb not null default '[]',
  improvement_tip text,
  created_at timestamptz default now()
);
create index if not exists idx_interview_user on public.interview_logs(user_id);

-- 7B. INTERVIEW PREFERENCES
create table if not exists public.interview_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade unique,
  role text not null check (role in ('sde','frontend','backend','ml_engineer','core_engineering')),
  level text not null check (level in ('beginner','intermediate','advanced')),
  interview_type text not null check (interview_type in ('dsa','system_design','behavioral','project_based','mixed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_interview_preferences_user on public.interview_preferences(user_id);

-- 8. APPLICATIONS
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  company text not null,
  role text not null,
  status text not null default 'saved' check (status in ('saved','applied','interviewing','offered','rejected','accepted')),
  url text,
  notes text,
  applied_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists idx_applications_user on public.applications(user_id);

-- ============================================
--  AUTO-CREATE PROFILE ON USER SIGNUP
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Drop existing trigger if any
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
--  ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.missions enable row level security;
alter table public.tasks enable row level security;
alter table public.resumes enable row level security;
alter table public.hireability_scores enable row level security;
alter table public.ai_sessions enable row level security;
alter table public.interview_logs enable row level security;
alter table public.interview_preferences enable row level security;
alter table public.applications enable row level security;

-- PROFILES: user can only access their own profile
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;

create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- MISSIONS
drop policy if exists "Users can view own missions" on public.missions;
drop policy if exists "Users can insert own missions" on public.missions;
drop policy if exists "Users can update own missions" on public.missions;
drop policy if exists "Users can delete own missions" on public.missions;
create policy "Users can view own missions" on public.missions for select using (auth.uid() = user_id);
create policy "Users can insert own missions" on public.missions for insert with check (auth.uid() = user_id);
create policy "Users can update own missions" on public.missions for update using (auth.uid() = user_id);
create policy "Users can delete own missions" on public.missions for delete using (auth.uid() = user_id);

-- TASKS
drop policy if exists "Users can view own tasks" on public.tasks;
drop policy if exists "Users can insert own tasks" on public.tasks;
drop policy if exists "Users can update own tasks" on public.tasks;
drop policy if exists "Users can delete own tasks" on public.tasks;
create policy "Users can view own tasks" on public.tasks for select using (auth.uid() = user_id);
create policy "Users can insert own tasks" on public.tasks for insert with check (auth.uid() = user_id);
create policy "Users can update own tasks" on public.tasks for update using (auth.uid() = user_id);
create policy "Users can delete own tasks" on public.tasks for delete using (auth.uid() = user_id);

-- RESUMES
drop policy if exists "Users can view own resume" on public.resumes;
drop policy if exists "Users can insert own resume" on public.resumes;
drop policy if exists "Users can update own resume" on public.resumes;
create policy "Users can view own resume" on public.resumes for select using (auth.uid() = user_id);
create policy "Users can insert own resume" on public.resumes for insert with check (auth.uid() = user_id);
create policy "Users can update own resume" on public.resumes for update using (auth.uid() = user_id);

-- HIREABILITY SCORES
drop policy if exists "Users can view own scores" on public.hireability_scores;
drop policy if exists "Users can insert own scores" on public.hireability_scores;
create policy "Users can view own scores" on public.hireability_scores for select using (auth.uid() = user_id);
create policy "Users can insert own scores" on public.hireability_scores for insert with check (auth.uid() = user_id);

-- AI SESSIONS
drop policy if exists "Users can view own sessions" on public.ai_sessions;
drop policy if exists "Users can insert own sessions" on public.ai_sessions;
create policy "Users can view own sessions" on public.ai_sessions for select using (auth.uid() = user_id);
create policy "Users can insert own sessions" on public.ai_sessions for insert with check (auth.uid() = user_id);

-- INTERVIEW LOGS
drop policy if exists "Users can view own logs" on public.interview_logs;
drop policy if exists "Users can insert own logs" on public.interview_logs;
create policy "Users can view own logs" on public.interview_logs for select using (auth.uid() = user_id);
create policy "Users can insert own logs" on public.interview_logs for insert with check (auth.uid() = user_id);

-- INTERVIEW PREFERENCES
drop policy if exists "Users can view own interview preferences" on public.interview_preferences;
drop policy if exists "Users can insert own interview preferences" on public.interview_preferences;
drop policy if exists "Users can update own interview preferences" on public.interview_preferences;
create policy "Users can view own interview preferences" on public.interview_preferences for select using (auth.uid() = user_id);
create policy "Users can insert own interview preferences" on public.interview_preferences for insert with check (auth.uid() = user_id);
create policy "Users can update own interview preferences" on public.interview_preferences for update using (auth.uid() = user_id);

-- APPLICATIONS
drop policy if exists "Users can view own apps" on public.applications;
drop policy if exists "Users can insert own apps" on public.applications;
drop policy if exists "Users can update own apps" on public.applications;
drop policy if exists "Users can delete own apps" on public.applications;
create policy "Users can view own apps" on public.applications for select using (auth.uid() = user_id);
create policy "Users can insert own apps" on public.applications for insert with check (auth.uid() = user_id);
create policy "Users can update own apps" on public.applications for update using (auth.uid() = user_id);
create policy "Users can delete own apps" on public.applications for delete using (auth.uid() = user_id);
