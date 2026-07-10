-- Run this once in Supabase → SQL Editor, then Sign In wiring can go live.

create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  avatar_url text,
  editing_since int,
  company text,
  country text,
  social_url text,
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
-- first time, pre-filled with whatever Google gives us.
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

-- ---------- Premium subscriptions (Stripe) ----------

create table if not exists subscriptions (
  user_id uuid references auth.users on delete cascade primary key,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  status text not null default 'inactive', -- active | past_due | canceled | inactive
  current_period_end timestamp with time zone,
  updated_at timestamp with time zone default now()
);

alter table subscriptions enable row level security;

-- Users can see their own subscription status (needed to unlock premium
-- links client-side). Only the Edge Function (service role) can write here —
-- no insert/update policy for regular users, so Stripe webhooks are the only
-- way this table changes.
create policy "Users can view their own subscription"
  on subscriptions for select
  using (auth.uid() = user_id);

-- ---------- Email subscribers (for the "Get notified" list) ----------

create table if not exists subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text,
  subscribed_at timestamp with time zone default now()
);

alter table subscribers enable row level security;

-- Anyone can sign up (anonymous insert), but nobody can read the list
-- back from the browser — only the service role (Edge Function) can,
-- which is what actually sends the campaign emails via Resend.
create policy "Anyone can subscribe"
  on subscribers for insert
  with check (true);
