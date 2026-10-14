-- The demo account is public, so seed content must survive visitors.

alter table public.profiles add column is_seed boolean not null default false;
alter table public.listings add column is_seed boolean not null default false;
alter table public.conversations add column is_seed boolean not null default false;

-- is_seed is never client-writable: restrict INSERT to explicit columns.
revoke insert on public.listings from authenticated;
grant insert (id, seller_id, title, description, price, category, condition, status, images, lat, lng, location_name)
  on public.listings to authenticated;

-- Seed listings: only the status can change, and they can't be deleted.
create function private.protect_seed_listing()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if old.is_seed and current_user in ('authenticated', 'anon') then
      raise exception 'Demo listings can''t be deleted' using errcode = '42501';
    end if;
    return old;
  end if;

  if old.is_seed and current_user in ('authenticated', 'anon') and (
    new.title, new.description, new.price, new.category, new.condition,
    new.images, new.lat, new.lng, new.location_name
  ) is distinct from (
    old.title, old.description, old.price, old.category, old.condition,
    old.images, old.lat, old.lng, old.location_name
  ) then
    raise exception 'Demo listings can only change status' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger listings_protect_seed
  before update or delete on public.listings
  for each row execute function private.protect_seed_listing();

-- Seed profiles (including the demo account) keep their name, photo and bio.
create function private.protect_seed_profile()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.is_seed and current_user in ('authenticated', 'anon') then
    raise exception 'Demo profiles can''t be edited' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_seed
  before update on public.profiles
  for each row execute function private.protect_seed_profile();

-- ---------------------------------------------------------------------------
-- Demo sellers answer buyers automatically, so visitors can watch real-time
-- chat work without a second account.
-- ---------------------------------------------------------------------------
create function private.demo_reply_text(body text, seller_name text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when body ~* '(less|lower|offer|discount|deal|\$\s*\d)' then
      'I could come down a little if you can pick it up this week. What were you thinking?'
    when body ~* '(when|pick ?up|today|tomorrow|tonight|weekend|time)' then
      'Evenings after 6 work best for me, or weekend mornings. What suits you?'
    when body ~* '(available|still|sold|have it)' then
      'Hi! Yes, it''s still available.'
    when body ~* '(condition|scratch|damage|work|broken|size|dimension|measure)' then
      'It''s in the shape you see in the photos. Happy to send a closer picture of anything.'
    else
      'Thanks for the message! When would you like to come by?'
  end
  || E'\n\n' || '(Automatic reply: ' || split_part(seller_name, ' ', 1) || ' is a demo seller.)';
$$;

create function private.send_demo_replies()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
  n integer := 0;
begin
  for r in
    select c.id, c.seller_id, p.display_name,
      (select m.body from public.messages m
        where m.conversation_id = c.id order by m.created_at desc limit 1) as last_body
    from public.conversations c
    join public.profiles p on p.id = c.seller_id
    join public.profiles b on b.id = c.buyer_id
    where p.is_seed
      and c.last_message_sender_id = c.buyer_id
      and c.last_message_at < now() - interval '8 seconds'
      and c.last_message_at > now() - interval '1 day'
      -- Seed buyers' threads are staged demo content; only reply to real visitors and the demo account.
      and (not b.is_seed or b.id = 'b2a0af7c-7ba8-5cfc-b395-ab8d1fd58c06')
    limit 50
  loop
    insert into public.messages (conversation_id, sender_id, body)
    values (r.id, r.seller_id, private.demo_reply_text(coalesce(r.last_body, ''), r.display_name));
    n := n + 1;
  end loop;
  return n;
end;
$$;

revoke all on function private.send_demo_replies() from public, anon, authenticated;
revoke all on function private.demo_reply_text(text, text) from public, anon, authenticated;
revoke all on function private.protect_seed_listing() from public, anon, authenticated;
revoke all on function private.protect_seed_profile() from public, anon, authenticated;

create extension if not exists pg_cron;

select cron.schedule('stoop-demo-replies', '15 seconds', $$select private.send_demo_replies()$$);

-- Nightly tidy-up of what visitors leave behind on the shared demo account (Maya).
select cron.schedule(
  'stoop-demo-cleanup',
  '17 4 * * *',
  $$
    delete from public.listings
    where seller_id = 'b2a0af7c-7ba8-5cfc-b395-ab8d1fd58c06'
      and not is_seed and created_at < now() - interval '1 day';
    delete from public.conversations
    where 'b2a0af7c-7ba8-5cfc-b395-ab8d1fd58c06' in (buyer_id, seller_id)
      and not is_seed and created_at < now() - interval '1 day';
  $$
);

-- Mark the seeded demo accounts.
update public.profiles p set is_seed = true
from auth.users u where u.id = p.id and u.email like '%@demo.stoop.example';
