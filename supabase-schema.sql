create table if not exists public.resumes (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  clerk_user_id text not null,
  extracted_text text not null,
  score int not null,
  missing_keywords jsonb not null default '[]'::jsonb,
  improved_bullets jsonb not null default '[]'::jsonb,
  job_description text not null
);

create table if not exists public.interviews (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  clerk_user_id text not null,
  role_title text not null,
  job_description text not null,
  transcript jsonb not null default '[]'::jsonb,
  latest_feedback jsonb not null default '{}'::jsonb,
  question_index int not null default 0,
  completed boolean not null default false
);

create table if not exists public.saved_jobs (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  clerk_user_id text not null,
  external_id text,
  title text not null,
  company text not null,
  location text,
  apply_url text,
  description_snippet text,
  source text not null default 'SerpApi'
);
