-- Run this once in Supabase → SQL Editor, then Sign In wiring can go live.

create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  avatar_url text,
  editing_since int,
  company text,
  created_at timestamp with time zone default now()
);

alter table profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on profiles for select
  using (true);

create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- Auto-create a blank profile row the moment someone signs in for the
-- first time, pre-filled with whatever Google/GitHub gives us.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'user_name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
