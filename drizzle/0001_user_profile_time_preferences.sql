alter table "user_profiles" add column if not exists "time_format" text not null default '12h';
alter table "user_profiles" add column if not exists "time_zone" text not null default 'Asia/Kolkata';
