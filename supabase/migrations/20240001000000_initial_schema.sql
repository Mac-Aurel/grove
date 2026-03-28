-- ============================================================
-- Grove — Initial Schema
-- ============================================================

-- ─── Utility: updated_at trigger function ───────────────────
create or replace function handle_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── Utility: new user bootstrap trigger function ───────────
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );

  insert into public.streaks (user_id)
  values (new.id);

  return new;
end;
$$;

-- ============================================================
-- Tables
-- ============================================================

-- ─── profiles ───────────────────────────────────────────────
create table public.profiles (
  id              uuid        primary key references auth.users(id) on delete cascade,
  username        text        not null unique,
  display_name    text        not null,
  avatar_url      text,
  bio             text,
  is_public       boolean     not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint username_length   check (char_length(username) between 2 and 30),
  constraint username_format   check (username ~ '^[a-z0-9_]+$'),
  constraint display_name_length check (char_length(display_name) between 1 and 60),
  constraint bio_length        check (bio is null or char_length(bio) <= 300)
);

create index idx_profiles_username on public.profiles(username);

create trigger on_profiles_updated
  before update on public.profiles
  for each row execute function handle_updated_at();

-- ─── tasks ──────────────────────────────────────────────────
create table public.tasks (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references public.profiles(id) on delete cascade,
  title           text        not null,
  description     text,
  is_public       boolean     not null default false,
  is_completed    boolean     not null default false,
  completed_at    timestamptz,
  photo_proof_url text,
  scheduled_date  date        not null default current_date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint title_length check (char_length(title) between 1 and 200),
  constraint description_length check (description is null or char_length(description) <= 1000),
  constraint completed_consistency check (
    (is_completed = false and completed_at is null) or
    (is_completed = true  and completed_at is not null)
  )
);

create index idx_tasks_user_id        on public.tasks(user_id);
create index idx_tasks_scheduled_date on public.tasks(scheduled_date);
create index idx_tasks_user_date      on public.tasks(user_id, scheduled_date);
create index idx_tasks_public         on public.tasks(is_public) where is_public = true;

create trigger on_tasks_updated
  before update on public.tasks
  for each row execute function handle_updated_at();

-- ─── friendships ────────────────────────────────────────────
create type friendship_status as enum ('pending', 'accepted', 'rejected', 'blocked');

create table public.friendships (
  id            uuid              primary key default gen_random_uuid(),
  requester_id  uuid              not null references public.profiles(id) on delete cascade,
  addressee_id  uuid              not null references public.profiles(id) on delete cascade,
  status        friendship_status not null default 'pending',
  created_at    timestamptz       not null default now(),
  updated_at    timestamptz       not null default now(),

  constraint no_self_friendship check (requester_id <> addressee_id),
  constraint unique_friendship   unique (requester_id, addressee_id)
);

create index idx_friendships_requester on public.friendships(requester_id);
create index idx_friendships_addressee on public.friendships(addressee_id);
create index idx_friendships_status    on public.friendships(status);

create trigger on_friendships_updated
  before update on public.friendships
  for each row execute function handle_updated_at();

-- ─── streaks ────────────────────────────────────────────────
create table public.streaks (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             uuid        not null unique references public.profiles(id) on delete cascade,
  current_streak      integer     not null default 0,
  longest_streak      integer     not null default 0,
  last_completed_date date,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint current_streak_non_negative check (current_streak >= 0),
  constraint longest_streak_non_negative check (longest_streak >= 0),
  constraint longest_gte_current         check (longest_streak >= current_streak)
);

create index idx_streaks_user_id on public.streaks(user_id);

create trigger on_streaks_updated
  before update on public.streaks
  for each row execute function handle_updated_at();

-- ─── garden_plants ──────────────────────────────────────────
create table public.garden_plants (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references public.profiles(id) on delete cascade,
  plant_type      text        not null,
  name            text        not null,
  level           integer     not null default 1,
  xp              integer     not null default 0,
  last_watered_at timestamptz,
  created_at      timestamptz not null default now(),

  constraint plant_type_length check (char_length(plant_type) between 1 and 50),
  constraint plant_name_length check (char_length(name) between 1 and 60),
  constraint level_positive    check (level >= 1),
  constraint xp_non_negative   check (xp >= 0)
);

create index idx_garden_plants_user_id on public.garden_plants(user_id);

-- ─── push_tokens ────────────────────────────────────────────
create type device_platform as enum ('ios', 'android');

create table public.push_tokens (
  id          uuid            primary key default gen_random_uuid(),
  user_id     uuid            not null references public.profiles(id) on delete cascade,
  token       text            not null unique,
  platform    device_platform not null,
  created_at  timestamptz     not null default now(),
  updated_at  timestamptz     not null default now()
);

create index idx_push_tokens_user_id on public.push_tokens(user_id);

create trigger on_push_tokens_updated
  before update on public.push_tokens
  for each row execute function handle_updated_at();

-- ============================================================
-- Auth trigger: bootstrap profile + streak on signup
-- ============================================================
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles      enable row level security;
alter table public.tasks         enable row level security;
alter table public.friendships   enable row level security;
alter table public.streaks       enable row level security;
alter table public.garden_plants enable row level security;
alter table public.push_tokens   enable row level security;

-- ─── profiles policies ──────────────────────────────────────
create policy "profiles_select_all"
  on public.profiles for select
  using (true);

create policy "profiles_update_owner"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ─── tasks policies ─────────────────────────────────────────
create policy "tasks_select_owner"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "tasks_select_friend_public"
  on public.tasks for select
  using (
    is_public = true
    and exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and (
          (f.requester_id = auth.uid() and f.addressee_id = tasks.user_id)
          or
          (f.addressee_id = auth.uid() and f.requester_id = tasks.user_id)
        )
    )
  );

create policy "tasks_insert_owner"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "tasks_update_owner"
  on public.tasks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "tasks_delete_owner"
  on public.tasks for delete
  using (auth.uid() = user_id);

-- ─── friendships policies ────────────────────────────────────
create policy "friendships_select_participant"
  on public.friendships for select
  using (
    auth.uid() = requester_id
    or auth.uid() = addressee_id
  );

create policy "friendships_insert_requester"
  on public.friendships for insert
  with check (auth.uid() = requester_id);

create policy "friendships_update_participant"
  on public.friendships for update
  using (
    auth.uid() = requester_id
    or auth.uid() = addressee_id
  )
  with check (
    auth.uid() = requester_id
    or auth.uid() = addressee_id
  );

-- ─── streaks policies ────────────────────────────────────────
create policy "streaks_owner_only"
  on public.streaks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── garden_plants policies ──────────────────────────────────
create policy "garden_plants_owner_only"
  on public.garden_plants for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── push_tokens policies ────────────────────────────────────
create policy "push_tokens_owner_only"
  on public.push_tokens for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
