create extension if not exists pgcrypto;

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Untitled Document',
  content jsonb not null,
  owner_id text not null,
  page_size text not null default 'a4',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists document_members (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  user_id text not null,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  created_at timestamptz default now(),
  unique(document_id, user_id)
);

create table if not exists document_assets (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  uploaded_by text not null,
  storage_path text not null,
  file_name text not null,
  file_type text not null,
  file_size int,
  created_at timestamptz default now()
);

create table if not exists user_profiles (
  user_id text primary key,
  display_name text,
  avatar_url text,
  updated_at timestamptz default now()
);

create table if not exists share_links (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  token text unique not null,
  role text not null check (role in ('editor', 'viewer')),
  created_by text not null,
  expires_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists document_activity (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete set null,
  actor_id text not null,
  actor_email text not null,
  action text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz default now()
);
