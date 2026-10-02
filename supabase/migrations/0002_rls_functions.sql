-- Helpers
create or replace function is_staff() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role in ('pps_admin','community_admin','professional','facilitator')) $$;
create or replace function is_pps_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'pps_admin') $$;
create or replace function has_community_role(cid uuid, r cm_role) returns boolean language sql stable security definer set search_path = public as $$
  select is_pps_admin() or exists (select 1 from community_members where community_id = cid and user_id = auth.uid() and role = r and status = 'active') $$;
create or replace function is_channel_member(ch uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from channels c where c.id = ch and (
      (c.kind = 'circle' and exists (select 1 from circle_members m where m.circle_id = c.circle_id and m.user_id = auth.uid()))
      or (c.kind = 'buddy' and exists (select 1 from buddy_pairs b where b.id = c.buddy_pair_id and auth.uid() in (b.inviter_id, b.invitee_id)))
      or (c.kind = 'announcements' and exists (select 1 from community_members m where m.community_id = c.community_id and m.user_id = auth.uid() and m.status='active'))
    )) or is_pps_admin() $$;

-- Enable RLS everywhere
do $$ declare t text; begin
  for t in select tablename from pg_tables where schemaname='public' loop
    execute format('alter table %I enable row level security', t);
  end loop; end $$;

-- Public read content
create policy pub_read on courses for select using (true);
create policy pub_read on lessons for select using (true);
create policy pub_read on quiz_questions for select using (true);
create policy pub_read on actions for select using (true);
create policy pub_read on pathways for select using (true);
create policy pub_read on milestones for select using (true);
create policy pub_read on badges for select using (true);
create policy pub_read on safety_resources for select using (true);
create policy pub_read on communities for select using (true);
create policy pub_read on circles for select using (true);
create policy pub_read on events for select using (published or is_staff());
create policy pub_read on sessions for select using (true);
create policy pub_read on rewards for select using (true);
create policy pub_read on challenges for select using (true);

-- Staff write on content
do $$ declare t text; begin
  foreach t in array array['courses','lessons','quiz_questions','actions','pathways','milestones','badges','safety_resources','communities','circles','events','sessions','rewards','challenges'] loop
    execute format('create policy staff_write on %I for all using (is_staff()) with check (is_staff())', t);
  end loop; end $$;

-- Own-row policies
do $$ declare t text; begin
  foreach t in array array['lesson_progress','action_completions','user_milestones','invest_sim_runs','invest_checklist','streaks','confidence_surveys','notifications','user_blocks','session_rsvps','challenge_completions'] loop
    execute format('create policy own_rw on %I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop; end $$;
create policy own_blocks on user_blocks for all using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

create policy profiles_self on profiles for select using (id = auth.uid() or is_staff());
create policy profiles_update on profiles for update using (id = auth.uid()) with check (id = auth.uid() and role = (select role from profiles where id = auth.uid()));
create policy cm_read on community_members for select using (user_id = auth.uid() or has_community_role(community_id,'admin'));
create policy cm_join on community_members for insert with check (user_id = auth.uid());
create policy cir_read on circle_members for select using (user_id = auth.uid() or is_staff());
create policy cir_join on circle_members for insert with check (user_id = auth.uid());
create policy cir_update on circle_members for update using (user_id = auth.uid());

create policy ch_read on channels for select using (is_channel_member(id));
create policy msg_read on messages for select using (is_channel_member(channel_id) and not exists (select 1 from user_blocks b where b.blocker_id = auth.uid() and b.blocked_id = messages.user_id));
create policy msg_send on messages for insert with check (user_id = auth.uid() and kind = 'user' and is_channel_member(channel_id));
create policy msg_staff on messages for update using (is_staff());
create policy rx_rw on message_reactions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy rx_read on message_reactions for select using (exists (select 1 from messages m where m.id = message_id and is_channel_member(m.channel_id)));
create policy rep_ins on message_reports for insert with check (reporter_id = auth.uid());
create policy rep_staff on message_reports for all using (is_staff());

create policy pe_read on point_events for select using (user_id = auth.uid());
create policy ub_read on user_badges for select using (user_id = auth.uid());
create policy bs_own on badge_shares for all using (exists (select 1 from user_badges u where u.id = user_badge_id and u.user_id = auth.uid()));
create policy rc_own on reward_claims for select using (user_id = auth.uid() or is_pps_admin());
create policy rc_ins on reward_claims for insert with check (user_id = auth.uid() and status = 'claimed');
create policy rc_admin on reward_claims for update using (is_pps_admin());
create policy hr_own on help_requests for select using (user_id = auth.uid() or is_staff());
create policy hr_ins on help_requests for insert with check (user_id = auth.uid());
create policy hr_staff on help_requests for update using (is_staff());
create policy bk_own on bookings for select using (user_id = auth.uid() or is_staff());
create policy bp_pair on buddy_pairs for select using (auth.uid() in (inviter_id, invitee_id));
create policy bp_ins on buddy_pairs for insert with check (inviter_id = auth.uid());
create policy bpl_read on buddy_plans for select using (exists (select 1 from buddy_pairs p where p.id = pair_id and auth.uid() in (p.inviter_id,p.invitee_id)));
create policy bpp_read on buddy_plan_progress for select using (exists (select 1 from buddy_plans l join buddy_pairs p on p.id=l.pair_id where l.id = plan_id and auth.uid() in (p.inviter_id,p.invitee_id)));
create policy bpp_ins on buddy_plan_progress for insert with check (user_id = auth.uid());
create policy att_read on session_attendance for select using (user_id = auth.uid() or is_staff());
create policy att_staff on session_attendance for all using (is_staff());
create policy ae_ins on analytics_events for insert with check (user_id = auth.uid());
create policy ae_read on analytics_events for select using (is_pps_admin());
create policy mutes_read on mutes for select using (user_id = auth.uid() or is_staff());
create policy mutes_staff on mutes for all using (is_staff());

-- Bookings with waitlist (transactional)
create or replace function book_event(p_event uuid) returns booking_status language plpgsql security definer set search_path = public as $$
declare cap int; taken int; st booking_status; pos int;
begin
  select capacity into cap from events where id = p_event for update;
  if cap is null then raise exception 'event not found'; end if;
  select count(*) into taken from bookings where event_id = p_event and status in ('booked','checked_in');
  if exists (select 1 from bookings where event_id=p_event and user_id=auth.uid() and status <> 'cancelled') then
    return (select status from bookings where event_id=p_event and user_id=auth.uid());
  end if;
  if taken < cap then st := 'booked'; pos := null;
  else st := 'waitlisted'; select coalesce(max(waitlist_position),0)+1 into pos from bookings where event_id=p_event and status='waitlisted'; end if;
  insert into bookings (event_id,user_id,status,waitlist_position) values (p_event,auth.uid(),st,pos)
  on conflict (event_id,user_id) do update set status = excluded.status, waitlist_position = excluded.waitlist_position;
  return st;
end $$;

create or replace function cancel_booking(p_booking uuid) returns void language plpgsql security definer set search_path = public as $$
declare b bookings; nxt bookings;
begin
  select * into b from bookings where id = p_booking and user_id = auth.uid() for update;
  if not found then raise exception 'booking not found'; end if;
  perform 1 from events where id = b.event_id for update;
  update bookings set status='cancelled', waitlist_position=null where id = b.id;
  if b.status = 'booked' then
    select * into nxt from bookings where event_id=b.event_id and status='waitlisted' order by waitlist_position limit 1 for update;
    if found then
      update bookings set status='booked', waitlist_position=null where id = nxt.id;
      insert into notifications (user_id,kind,title,body,href) values (nxt.user_id,'booking','You''re in! A seat opened up','Your waitlisted booking is now confirmed.','/tickets/'||nxt.id);
    end if;
  end if;
end $$;

-- Leaderboards (opted-in only / aggregated)
create or replace function period_start(p text) returns timestamptz language sql immutable as $$
  select case when p = 'week' then (date_trunc('week', now() at time zone 'Africa/Johannesburg')) at time zone 'Africa/Johannesburg' else '-infinity'::timestamptz end $$;

create or replace function leaderboard_individual(p_community uuid, p_period text)
returns table (user_id uuid, name text, points bigint, rank bigint) language sql stable security definer set search_path = public as $$
  with m as (select cm.user_id from community_members cm where cm.community_id = p_community and cm.status='active'),
  pts as (
    select pe.user_id, sum(pe.points) pts from point_events pe
    where pe.user_id in (select user_id from m) and pe.created_at >= period_start(p_period)
      and (pe.community_id is null or pe.community_id = p_community)
    group by pe.user_id)
  select p.id, coalesce(nullif(p.nickname,''), split_part(p.display_name,' ',1)), coalesce(pts.pts,0)::bigint,
         rank() over (order by coalesce(pts.pts,0) desc)
  from profiles p join m on m.user_id = p.id left join pts on pts.user_id = p.id
  where p.show_on_leaderboard $$;

create or replace function leaderboard_circles(p_community uuid, p_period text)
returns table (circle_id uuid, name text, members bigint, avg_points numeric, rank bigint) language sql stable security definer set search_path = public as $$
  with cm as (select c.id cid, c.name, m.user_id from circles c join circle_members m on m.circle_id = c.id where c.community_id = p_community),
  pts as (select pe.user_id, sum(pe.points) s from point_events pe
          where pe.created_at >= period_start(p_period) and (pe.community_id is null or pe.community_id = p_community) group by pe.user_id)
  select cid, name, count(*)::bigint, round(coalesce(sum(pts.s),0)::numeric / count(*), 1),
         rank() over (order by coalesce(sum(pts.s),0)::numeric / count(*) desc, name)
  from cm left join pts on pts.user_id = cm.user_id group by cid, name $$;

-- Public badge share page data
create or replace function public_badge(p_code text)
returns table (badge_name text, meaning_line text, rarity text, slug text, earned_at timestamptz, who text)
language sql stable security definer set search_path = public as $$
  select b.name, b.meaning_line, b.rarity, b.slug, ub.earned_at,
         case when s.name_mode = 'nickname' and coalesce(p.nickname,'') <> '' then p.nickname else split_part(p.display_name,' ',1) end
  from badge_shares s join user_badges ub on ub.id = s.user_badge_id join badges b on b.slug = ub.badge_slug
  join profiles p on p.id = ub.user_id where s.code = p_code and s.revoked_at is null $$;
grant execute on function public_badge(text) to anon, authenticated;
