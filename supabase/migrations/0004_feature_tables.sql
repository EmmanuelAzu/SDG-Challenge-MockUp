-- Life Tracks, glossary, credibility, feedback, tools, letterbox, reminders, Campus Cup
create table life_tracks (slug text primary key, name text not null, description text, lesson_ids uuid[] not null default '{}', first_pathway text not null default 'milestones');
create table glossary_terms (slug text primary key, term text not null, definition text not null, money_example text);
create table glossary_lookups (user_id uuid references profiles on delete cascade, term_slug text references glossary_terms on delete cascade, created_at timestamptz default now(), primary key (user_id, term_slug));
create table lesson_sources (id uuid primary key default gen_random_uuid(), lesson_id uuid references lessons on delete cascade, title text not null, url text);
create table lesson_reviews (lesson_id uuid references lessons on delete cascade, reviewer_name text not null, credential text not null, reviewed_on date not null, primary key (lesson_id, reviewer_name));
create table lesson_feedback (lesson_id uuid references lessons on delete cascade, user_id uuid references profiles on delete cascade, rating smallint not null check (rating between 1 and 5), confusing_text text, created_at timestamptz default now(), primary key (lesson_id, user_id));
create table topic_suggestions (id uuid primary key default gen_random_uuid(), user_id uuid references profiles on delete set null, body text not null check (char_length(body) <= 200), votes int not null default 1, created_at timestamptz default now());
create table topic_votes (suggestion_id uuid references topic_suggestions on delete cascade, user_id uuid references profiles on delete cascade, primary key (suggestion_id, user_id));

create table budgets (id uuid primary key default gen_random_uuid(), user_id uuid not null references profiles on delete cascade, template text, income numeric, lines jsonb not null default '{}', created_at timestamptz default now());
create table savings_goals (id uuid primary key default gen_random_uuid(), user_id uuid not null references profiles on delete cascade, name text not null, emoji text, target numeric not null check (target > 0), due_on date, created_at timestamptz default now());
create table savings_deposits (id uuid primary key default gen_random_uuid(), goal_id uuid not null references savings_goals on delete cascade, amount numeric not null, created_at timestamptz default now());
create table payslip_sim_runs (id uuid primary key default gen_random_uuid(), user_id uuid not null references profiles on delete cascade, gross numeric, retirement_pct numeric, allocation jsonb, created_at timestamptz default now());

create table friendships (requester_id uuid references profiles on delete cascade, addressee_id uuid references profiles on delete cascade, status text not null default 'pending' check (status in ('pending','accepted')), created_at timestamptz default now(), primary key (requester_id, addressee_id), check (requester_id <> addressee_id));
create table letterbox_posts (id uuid primary key default gen_random_uuid(), user_id uuid not null references profiles on delete cascade, kind text not null, ref_id text, created_at timestamptz default now());
create table letterbox_reactions (post_id uuid references letterbox_posts on delete cascade, user_id uuid references profiles on delete cascade, emoji text not null check (emoji in ('💗','👏','🔥','🌱')), primary key (post_id, user_id, emoji));
create table letterbox_notes (id uuid primary key default gen_random_uuid(), post_id uuid references letterbox_posts on delete cascade, user_id uuid references profiles on delete cascade, body text not null check (char_length(body) <= 140), created_at timestamptz default now());

create table push_subscriptions (id uuid primary key default gen_random_uuid(), user_id uuid not null references profiles on delete cascade, endpoint text unique not null, keys jsonb not null, created_at timestamptz default now());
create table reminder_prefs (user_id uuid primary key references profiles on delete cascade, days smallint[] not null default '{2,4}', enabled boolean not null default true);
create table push_log (user_id uuid references profiles on delete cascade, week_key text, sent_on date, primary key (user_id, sent_on));

create table campus_cup_seasons (id uuid primary key default gen_random_uuid(), name text not null, starts_on date not null, ends_on date not null, prize_text text, awarded_at timestamptz);
create table campus_cup_entries (season_id uuid references campus_cup_seasons on delete cascade, community_id uuid references communities on delete cascade, primary key (season_id, community_id));

create or replace function is_friend(a uuid, b uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from friendships f where f.status = 'accepted' and ((f.requester_id = a and f.addressee_id = b) or (f.requester_id = b and f.addressee_id = a))) $$;
create or replace function can_see_post(p uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from letterbox_posts lp join profiles pr on pr.id = lp.user_id
    where lp.id = p and (lp.user_id = auth.uid() or (pr.share_milestones and is_friend(auth.uid(), lp.user_id)))) $$;

do $$ declare t text; begin
  for t in select tablename from pg_tables where schemaname='public' and tablename in
    ('life_tracks','glossary_terms','glossary_lookups','lesson_sources','lesson_reviews','lesson_feedback','topic_suggestions','topic_votes','budgets','savings_goals','savings_deposits','payslip_sim_runs','friendships','letterbox_posts','letterbox_reactions','letterbox_notes','push_subscriptions','reminder_prefs','push_log','campus_cup_seasons','campus_cup_entries') loop
    execute format('alter table %I enable row level security', t);
  end loop; end $$;

-- public read content
create policy pub_read on life_tracks for select using (true);
create policy pub_read on glossary_terms for select using (true);
create policy pub_read on lesson_sources for select using (true);
create policy pub_read on lesson_reviews for select using (true);
create policy pub_read on topic_suggestions for select using (auth.uid() is not null);
create policy pub_read on campus_cup_seasons for select using (true);
create policy pub_read on campus_cup_entries for select using (true);
do $$ declare t text; begin
  foreach t in array array['life_tracks','glossary_terms','lesson_sources','lesson_reviews','campus_cup_seasons'] loop
    execute format('create policy staff_write on %I for all using (is_staff()) with check (is_staff())', t);
  end loop; end $$;
create policy cce_staff on campus_cup_entries for all using (is_staff()) with check (is_staff());

-- own-row
do $$ declare t text; begin
  foreach t in array array['glossary_lookups','lesson_feedback','budgets','savings_goals','payslip_sim_runs','push_subscriptions','reminder_prefs','topic_votes'] loop
    execute format('create policy own_rw on %I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop; end $$;
create policy fb_staff on lesson_feedback for select using (is_staff());
create policy ts_ins on topic_suggestions for insert with check (user_id = auth.uid());
create policy ts_staff on topic_suggestions for all using (is_staff());
create policy sd_own on savings_deposits for all using (exists (select 1 from savings_goals g where g.id = goal_id and g.user_id = auth.uid())) with check (exists (select 1 from savings_goals g where g.id = goal_id and g.user_id = auth.uid()));

-- letterbox
create policy fr_read on friendships for select using (auth.uid() in (requester_id, addressee_id));
create policy fr_req on friendships for insert with check (requester_id = auth.uid() and status = 'pending');
create policy fr_accept on friendships for update using (addressee_id = auth.uid()) with check (addressee_id = auth.uid());
create policy fr_del on friendships for delete using (auth.uid() in (requester_id, addressee_id));
create policy lp_read on letterbox_posts for select using (can_see_post(id));
create policy lr_read on letterbox_reactions for select using (can_see_post(post_id));
create policy lr_write on letterbox_reactions for insert with check (user_id = auth.uid() and can_see_post(post_id));
create policy lr_del on letterbox_reactions for delete using (user_id = auth.uid());
create policy ln_read on letterbox_notes for select using (can_see_post(post_id));
create policy ln_write on letterbox_notes for insert with check (user_id = auth.uid() and can_see_post(post_id));
