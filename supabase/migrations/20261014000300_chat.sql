-- Buyer ↔ seller messaging with read receipts and Realtime.

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz,
  last_message_preview text,
  last_message_sender_id uuid references public.profiles (id) on delete set null,
  buyer_last_read_at timestamptz not null default now(),
  seller_last_read_at timestamptz not null default 'epoch',
  unique (listing_id, buyer_id),
  check (buyer_id <> seller_id)
);

create index conversations_buyer_idx on public.conversations (buyer_id, last_message_at desc nulls last);
create index conversations_seller_idx on public.conversations (seller_id, last_message_at desc nulls last);
create index conversations_last_sender_idx on public.conversations (last_message_sender_id);

create table public.messages (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index messages_conversation_idx on public.messages (conversation_id, created_at);
create index messages_sender_idx on public.messages (sender_id);

-- Participation check used by RLS. SECURITY DEFINER avoids re-evaluating
-- conversations' own policies inside messages' policies.
create function public.is_conversation_participant(conv_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.conversations c
    where c.id = conv_id
      and (select auth.uid()) in (c.buyer_id, c.seller_id)
  );
$$;

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "Participants read conversations"
  on public.conversations for select to authenticated
  using ((select auth.uid()) in (buyer_id, seller_id));

create policy "Participants read messages"
  on public.messages for select to authenticated
  using (public.is_conversation_participant(conversation_id));

create policy "Participants send messages"
  on public.messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and public.is_conversation_participant(conversation_id)
  );

-- Conversations are created and updated only through the functions below.
revoke insert, update, delete on public.conversations from anon, authenticated;
revoke update, delete on public.messages from anon, authenticated;
revoke all on public.messages from anon;

-- Opens (or reuses) the caller's conversation about a listing and returns its id.
create function public.start_conversation(p_listing_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_seller uuid;
  v_id uuid;
begin
  if v_user is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;

  select seller_id into v_seller from public.listings where id = p_listing_id;
  if v_seller is null then
    raise exception 'Listing not found' using errcode = 'P0002';
  end if;
  if v_seller = v_user then
    raise exception 'You cannot message yourself' using errcode = '22023';
  end if;

  insert into public.conversations (listing_id, buyer_id, seller_id)
  values (p_listing_id, v_user, v_seller)
  on conflict (listing_id, buyer_id) do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id from public.conversations
    where listing_id = p_listing_id and buyer_id = v_user;
  end if;

  return v_id;
end;
$$;

create function public.mark_conversation_read(p_conversation_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.conversations
  set buyer_last_read_at = case when buyer_id = (select auth.uid()) then now() else buyer_last_read_at end,
      seller_last_read_at = case when seller_id = (select auth.uid()) then now() else seller_last_read_at end
  where id = p_conversation_id
    and (select auth.uid()) in (buyer_id, seller_id);
$$;

create function public.unread_conversation_count()
returns integer
language sql
stable
security invoker
set search_path = ''
as $$
  select count(*)::integer
  from public.conversations c
  where (select auth.uid()) in (c.buyer_id, c.seller_id)
    and c.last_message_sender_id is distinct from (select auth.uid())
    and c.last_message_at is not null
    and c.last_message_at > case
      when c.buyer_id = (select auth.uid()) then c.buyer_last_read_at
      else c.seller_last_read_at
    end;
$$;

-- Keeps the inbox summary in sync and marks the sender's side as read.
create function public.handle_new_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.conversations
  set last_message_at = new.created_at,
      last_message_preview = left(new.body, 140),
      last_message_sender_id = new.sender_id,
      buyer_last_read_at = case when buyer_id = new.sender_id then new.created_at else buyer_last_read_at end,
      seller_last_read_at = case when seller_id = new.sender_id then new.created_at else seller_last_read_at end
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger on_message_created
  after insert on public.messages
  for each row execute function public.handle_new_message();

revoke execute on function public.handle_new_message() from public, anon, authenticated;
revoke execute on function public.is_conversation_participant(uuid) from public, anon;
revoke execute on function public.start_conversation(uuid) from public, anon;
revoke execute on function public.mark_conversation_read(uuid) from public, anon;
revoke execute on function public.unread_conversation_count() from public, anon;
grant execute on function public.is_conversation_participant(uuid) to authenticated;
grant execute on function public.start_conversation(uuid) to authenticated;
grant execute on function public.mark_conversation_read(uuid) to authenticated;
grant execute on function public.unread_conversation_count() to authenticated;

alter publication supabase_realtime add table public.messages, public.conversations;
