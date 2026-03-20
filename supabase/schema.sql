-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (extends auth.users)
create type preferred_shop_enum as enum ('Noyon', 'Compiègne', 'Clermont', 'Nogent-sur-Oise', 'Breteuil', 'Beauvais', 'Ferrières-en-Bray');
create type user_role_enum as enum ('user', 'admin');

create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  name text not null,
  role user_role_enum default 'user' not null,
  quit_date date,
  cigarettes_per_day integer default 0 not null,
  pack_price numeric(10,2) default 0 not null,
  preferred_shop preferred_shop_enum,
  fagerstrom_score integer,
  reward_name text,
  reward_amount numeric(10,2),
  craving_count integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Daily Messages Table
create table public.daily_messages (
  id uuid default uuid_generate_v4() primary key,
  day_number integer not null unique,
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Badges Table
create table public.badges (
  id uuid default uuid_generate_v4() primary key,
  day_threshold integer not null unique,
  title text not null,
  description text not null,
  icon text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Content Articles Table
create table public.content_articles (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  summary text not null,
  body text not null,
  category text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Nicotine Check-ins Table
create type feeling_enum as enum ('difficile', 'neutre', 'bien', 'excellent');

create table public.nicotine_checkins (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null default current_date,
  nicotine_mg numeric(4,1) not null,
  eliquid_name text not null,
  feeling feeling_enum not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Vaper Stories Table
create table public.vaper_stories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  author_name text not null,
  shop preferred_shop_enum not null,
  story_text text not null check (char_length(story_text) <= 500),
  is_published boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Admin Notes Table
create table public.admin_notes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  note text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Row Level Security (RLS) Policies

alter table public.profiles enable row level security;
alter table public.daily_messages enable row level security;
alter table public.badges enable row level security;
alter table public.content_articles enable row level security;
alter table public.nicotine_checkins enable row level security;
alter table public.vaper_stories enable row level security;
alter table public.admin_notes enable row level security;

-- Profiles: Users can read their own profile, Admins can read all profiles
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Admins can view all profiles" on public.profiles for select using (auth.uid() in (select id from public.profiles where role = 'admin'));
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Daily Messages: Anyone can read, only admins can modify
create policy "Anyone can view daily messages" on public.daily_messages for select using (true);
create policy "Admins can edit daily messages" on public.daily_messages for all using (auth.uid() in (select id from public.profiles where role = 'admin'));

-- Badges: Anyone can read, only admins can modify
create policy "Anyone can view badges" on public.badges for select using (true);
create policy "Admins can edit badges" on public.badges for all using (auth.uid() in (select id from public.profiles where role = 'admin'));

-- Content Articles: Anyone can read, only admins can modify
create policy "Anyone can view content articles" on public.content_articles for select using (true);
create policy "Admins can edit content articles" on public.content_articles for all using (auth.uid() in (select id from public.profiles where role = 'admin'));

-- Nicotine Check-ins: Users can read/write their own, Admins can read all
create policy "Users can view own checkins" on public.nicotine_checkins for select using (auth.uid() = user_id);
create policy "Admins can view all checkins" on public.nicotine_checkins for select using (auth.uid() in (select id from public.profiles where role = 'admin'));
create policy "Users can insert own checkins" on public.nicotine_checkins for insert with check (auth.uid() = user_id);
create policy "Users can update own checkins" on public.nicotine_checkins for update using (auth.uid() = user_id);

-- Vaper Stories: Anyone can read published, Users can read/write their own, Admins can do all
create policy "Anyone can view published stories" on public.vaper_stories for select using (is_published = true);
create policy "Users can view own stories" on public.vaper_stories for select using (auth.uid() = user_id);
create policy "Users can insert own stories" on public.vaper_stories for insert with check (auth.uid() = user_id);
create policy "Admins can manage all stories" on public.vaper_stories for all using (auth.uid() in (select id from public.profiles where role = 'admin'));

-- Admin Notes: Only admins can view and write
create policy "Admins can view notes" on public.admin_notes for select using (auth.uid() in (select id from public.profiles where role = 'admin'));
create policy "Admins can insert notes" on public.admin_notes for insert with check (auth.uid() in (select id from public.profiles where role = 'admin'));
create policy "Admins can update notes" on public.admin_notes for update using (auth.uid() in (select id from public.profiles where role = 'admin'));

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), 'user');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
