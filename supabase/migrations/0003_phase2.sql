-- Phase 2 additions
alter table courses add column if not exists milestone_id uuid references milestones;

create or replace function circle_directory(p_community uuid default null, p_circle uuid default null)
returns table (circle_id uuid, community_id uuid, name text, topic text, weekday smallint, start_time time, capacity int, is_open boolean,
               facilitator_name text, members bigint, is_member boolean)
language sql stable security definer set search_path = public as $$
  select c.id, c.community_id, c.name, c.topic, c.weekday, c.start_time, c.capacity, c.is_open,
         coalesce(nullif(f.nickname,''), split_part(f.display_name,' ',1)),
         (select count(*) from circle_members m where m.circle_id = c.id)::bigint,
         exists (select 1 from circle_members m where m.circle_id = c.id and m.user_id = auth.uid())
  from circles c left join profiles f on f.id = c.facilitator_id
  where (p_community is null or c.community_id = p_community) and (p_circle is null or c.id = p_circle)
  order by c.name $$;

create or replace function circle_week_progress(p_circle uuid)
returns table (done bigint, total bigint) language sql stable security definer set search_path = public as $$
  select
    (select count(distinct cm.user_id) from circle_members cm
       join point_events pe on pe.user_id = cm.user_id and pe.source = 'action' and pe.created_at >= period_start('week')
      where cm.circle_id = p_circle)::bigint,
    (select count(*) from circle_members where circle_id = p_circle)::bigint $$;

-- Names/avatars of people in a channel (profiles are otherwise private)
create or replace function channel_people(p_channel uuid)
returns table (user_id uuid, name text, avatar_url text) language sql stable security definer set search_path = public as $$
  select p.id, coalesce(nullif(p.nickname,''), split_part(p.display_name,' ',1)), p.avatar_url
  from profiles p
  where is_channel_member(p_channel) and p.id in (
    select m.user_id from channels c join circle_members m on m.circle_id = c.circle_id where c.id = p_channel
    union select b.inviter_id from channels c join buddy_pairs b on b.id = c.buddy_pair_id where c.id = p_channel
    union select b.invitee_id from channels c join buddy_pairs b on b.id = c.buddy_pair_id where c.id = p_channel
    union select m.user_id from channels c join community_members m on m.community_id = c.community_id where c.id = p_channel) $$;

do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table messages;
    alter publication supabase_realtime add table message_reactions;
  end if;
end $$;
