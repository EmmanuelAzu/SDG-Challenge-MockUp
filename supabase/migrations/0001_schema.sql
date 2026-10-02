-- Sisi core schema
create extension if not exists pgcrypto;

create type user_role as enum ('member','facilitator','community_admin','professional','pps_admin');
create type name_mode as enum ('first','nickname');
create type community_kind as enum ('university','workplace','community','oweek');
create type cm_role as enum ('member','facilitator','admin');
create type cm_status as enum ('pending','active');
create type channel_kind as enum ('circle','buddy','announcements');
create type session_type as enum ('circle_session','workshop','expert_qa','oweek');
create type booking_status as enum ('booked','waitlisted','cancelled','checked_in');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null default '',
  nickname text,
  avatar_url text,
  role user_role not null default 'member',
  goals text[] not null default '{}',
  life_track text,
  weekly_target smallint not null default 2 check (weekly_target between 1 and 3),
  focus_mode boolean not null default false,
  share_milestones boolean not null default false,
  xp int not null default 0,
  show_on_leaderboard boolean not null default false,
  share_name_mode name_mode not null default 'first',
  referral_code text unique not null default substr(encode(gen_random_bytes(6),'hex'),1,8),
  referred_by uuid references profiles(id),
  consented_at timestamptz,
  onboarded_at timestamptz,
  created_at timestamptz not null default now()
);

create table communities (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null, name text not null, description text, banner_url text,
  join_code text unique, requires_approval boolean not null default false,
  kind community_kind not null default 'community', created_at timestamptz not null default now()
);
create table community_members (
  community_id uuid references communities on delete cascade,
  user_id uuid references profiles on delete cascade,
  role cm_role not null default 'member', status cm_status not null default 'active',
  joined_at timestamptz not null default now(), primary key (community_id, user_id)
);
create table circles (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references communities on delete cascade,
  name text not null, topic text, facilitator_id uuid references profiles,
  weekday smallint, start_time time, capacity int not null default 8, is_open boolean not null default true
);
create table circle_members (
  circle_id uuid references circles on delete cascade, user_id uuid references profiles on delete cascade,
  agreed_rules_at timestamptz, joined_at timestamptz not null default now(), primary key (circle_id, user_id)
);

create table buddy_pairs (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references profiles, invitee_id uuid references profiles,
  invite_code text unique not null default substr(encode(gen_random_bytes(6),'hex'),1,10),
  status text not null default 'pending' check (status in ('pending','active','ended')),
  created_at timestamptz not null default now()
);
create table buddy_plans (id uuid primary key default gen_random_uuid(), pair_id uuid references buddy_pairs on delete cascade, week_start date not null, actions jsonb not null default '[]');
create table buddy_plan_progress (plan_id uuid references buddy_plans on delete cascade, user_id uuid references profiles on delete cascade, action_index int, done_at timestamptz default now(), primary key (plan_id,user_id,action_index));

create table channels (
  id uuid primary key default gen_random_uuid(), kind channel_kind not null,
  circle_id uuid references circles on delete cascade, buddy_pair_id uuid references buddy_pairs on delete cascade,
  community_id uuid references communities on delete cascade
);
create table messages (
  id uuid primary key default gen_random_uuid(), channel_id uuid not null references channels on delete cascade,
  user_id uuid references profiles on delete set null, body text not null default '',
  reply_to uuid references messages, image_path text, kind text not null default 'user' check (kind in ('user','system')),
  pinned boolean not null default false, deleted_at timestamptz, created_at timestamptz not null default now()
);
create index on messages (channel_id, created_at desc);
create table message_reactions (message_id uuid references messages on delete cascade, user_id uuid references profiles on delete cascade, emoji text, primary key (message_id,user_id,emoji));
create table message_reports (id uuid primary key default gen_random_uuid(), message_id uuid references messages on delete cascade, reporter_id uuid references profiles, reason text, status text not null default 'open');
create table user_blocks (blocker_id uuid references profiles on delete cascade, blocked_id uuid references profiles on delete cascade, primary key (blocker_id,blocked_id));
create table mutes (channel_id uuid references channels on delete cascade, user_id uuid references profiles on delete cascade, until timestamptz not null, primary key (channel_id,user_id));

create table courses (id uuid primary key default gen_random_uuid(), slug text unique not null, title text not null, topic text, level text, cover_url text, sort int default 0);
create table lessons (
  id uuid primary key default gen_random_uuid(), course_id uuid references courses on delete cascade, slug text not null,
  title text not null, format text not null default 'cards' check (format in ('video','cards','reel')), video_url text,
  cards jsonb not null default '[]', transcript text, takeaway text, duration_sec int default 180, sort int default 0,
  unique (course_id, slug)
);
create table quiz_questions (id uuid primary key default gen_random_uuid(), lesson_id uuid references lessons on delete cascade, prompt text not null, options jsonb not null, correct_index int not null, explanation text);
create table pathways (id uuid primary key default gen_random_uuid(), slug text unique not null, name text not null);
create table milestones (id uuid primary key default gen_random_uuid(), pathway_id uuid references pathways on delete cascade, slug text unique not null, title text not null, sort int, badge_slug text);
create table actions (id uuid primary key default gen_random_uuid(), lesson_id uuid references lessons on delete cascade, milestone_id uuid references milestones on delete cascade, title text not null, description text);
create table lesson_progress (user_id uuid references profiles on delete cascade, lesson_id uuid references lessons on delete cascade, status text not null default 'started', quiz_score int, completed_at timestamptz, primary key (user_id,lesson_id));
create table action_completions (user_id uuid references profiles on delete cascade, action_id uuid references actions on delete cascade, status text not null check (status in ('done','skipped')), completed_at timestamptz default now(), primary key (user_id,action_id));
create table user_milestones (user_id uuid references profiles on delete cascade, milestone_id uuid references milestones on delete cascade, completed_at timestamptz default now(), primary key (user_id,milestone_id));

create table invest_sim_runs (id uuid primary key default gen_random_uuid(), user_id uuid references profiles on delete cascade, monthly_amount int, years int, rate numeric, finished boolean default false, created_at timestamptz default now());
create table invest_checklist (user_id uuid references profiles on delete cascade, item text, done_at timestamptz default now(), primary key (user_id,item));

create table sessions (
  id uuid primary key default gen_random_uuid(), community_id uuid references communities on delete cascade,
  circle_id uuid references circles on delete set null, type session_type not null, title text not null, description text,
  host_id uuid references profiles, starts_at timestamptz not null, ends_at timestamptz, location text, online_url text,
  series_id uuid, cancelled_at timestamptz
);
create table session_rsvps (session_id uuid references sessions on delete cascade, user_id uuid references profiles on delete cascade, status text check (status in ('going','maybe','no')), primary key (session_id,user_id));
create table session_attendance (session_id uuid references sessions on delete cascade, user_id uuid references profiles on delete cascade, marked_by uuid references profiles, rating smallint check (rating between 1 and 5), primary key (session_id,user_id));
create table events (
  id uuid primary key default gen_random_uuid(), community_id uuid references communities, type session_type not null default 'workshop',
  title text not null, description text, cover_url text, host_name text, host_id uuid references profiles,
  starts_at timestamptz not null, ends_at timestamptz, location text, online_url text, capacity int not null default 30, published boolean not null default true
);
create table bookings (
  id uuid primary key default gen_random_uuid(), event_id uuid not null references events on delete cascade,
  user_id uuid not null references profiles on delete cascade, status booking_status not null,
  ticket_code text unique not null default upper(substr(encode(gen_random_bytes(8),'hex'),1,10)),
  waitlist_position int, created_at timestamptz not null default now(), unique (event_id,user_id)
);

create table point_events (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references profiles on delete cascade,
  community_id uuid references communities, source text not null, source_id text not null, points int not null,
  created_at timestamptz not null default now(), unique (user_id,source,source_id)
);
create index on point_events (user_id, created_at);
create table badges (slug text primary key, name text not null, description text, meaning_line text, rule jsonb, rarity text not null default 'common' check (rarity in ('common','rare','epic')), sort int default 0);
create table user_badges (id uuid primary key default gen_random_uuid(), user_id uuid references profiles on delete cascade, badge_slug text references badges, earned_at timestamptz default now(), unique (user_id,badge_slug));
create table badge_shares (id uuid primary key default gen_random_uuid(), code text unique not null default substr(encode(gen_random_bytes(6),'hex'),1,10), user_badge_id uuid references user_badges on delete cascade, name_mode name_mode not null default 'first', include_community boolean not null default false, revoked_at timestamptz, created_at timestamptz default now());
create table challenges (id uuid primary key default gen_random_uuid(), community_id uuid references communities, title text not null, description text, week_start date, points int default 20);
create table challenge_completions (challenge_id uuid references challenges on delete cascade, user_id uuid references profiles on delete cascade, completed_at timestamptz default now(), primary key (challenge_id,user_id));
create table rewards (id uuid primary key default gen_random_uuid(), slug text unique not null, title text not null, amount_cash int default 0, amount_credit int default 0, rule jsonb);
create table reward_claims (id uuid primary key default gen_random_uuid(), reward_id uuid references rewards, user_id uuid references profiles on delete cascade, status text not null default 'eligible' check (status in ('eligible','claimed','approved','rejected','paid')), updated_at timestamptz default now());
create table help_requests (id uuid primary key default gen_random_uuid(), user_id uuid references profiles on delete cascade, kind text check (kind in ('question','call')), topic text, body text, preferred_times jsonb, status text not null default 'open', answer text, answered_by uuid references profiles, created_at timestamptz default now());
create table safety_resources (id uuid primary key default gen_random_uuid(), category text, name text not null, phone text, sms text, url text, description text, verified boolean not null default false, sort int default 0);
create table confidence_surveys (id uuid primary key default gen_random_uuid(), user_id uuid references profiles on delete cascade, kind text check (kind in ('pre','post')), answers jsonb not null, created_at timestamptz default now());
create table analytics_events (id bigint generated always as identity primary key, user_id uuid, name text not null, props jsonb default '{}', created_at timestamptz default now());
create table notifications (id uuid primary key default gen_random_uuid(), user_id uuid references profiles on delete cascade, kind text, title text not null, body text, href text, read_at timestamptz, dedupe_key text, created_at timestamptz default now());
create unique index notifications_dedupe on notifications (user_id, dedupe_key) where dedupe_key is not null;

-- profile auto-create on signup
create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, display_name, referred_by)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name',''),
    (select id from profiles where referral_code = new.raw_user_meta_data->>'ref'));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();
