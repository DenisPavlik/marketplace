-- Rate limits for the AI shopping assistant: a per-visitor hourly cap and a global
-- daily cap, so a public demo can't run up the model bill.
--
-- The server proves it's the caller by passing a secret that lives in Supabase Vault
-- (not in this file). Create it once per project:
--   select vault.create_secret('<ASSISTANT_RATE_SECRET>', 'assistant_rate_secret');

create table private.assistant_usage (
  bucket text primary key,
  hits integer not null,
  window_start timestamptz not null
);

revoke all on private.assistant_usage from public, anon, authenticated;

-- Counts one hit in a fixed window and reports whether the bucket is still under its limit.
create function private.assistant_hit(p_bucket text, p_limit integer, p_window interval)
returns boolean
language sql
security definer
set search_path = ''
as $$
  insert into private.assistant_usage as u (bucket, hits, window_start)
  values (p_bucket, 1, now())
  on conflict (bucket) do update set
    hits = case when u.window_start < now() - p_window then 1 else u.hits + 1 end,
    window_start = case when u.window_start < now() - p_window then now() else u.window_start end
  returning hits <= p_limit;
$$;

revoke execute on function private.assistant_hit(text, integer, interval) from public, anon, authenticated;

-- Returns 'ok', 'visitor' (this visitor hit the hourly cap) or 'global' (daily cap reached).
-- p_visitor is an opaque hash computed by the server.
create function public.assistant_take_quota(p_visitor text, p_secret text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret text;
begin
  select decrypted_secret into v_secret
  from vault.decrypted_secrets
  where name = 'assistant_rate_secret';

  if v_secret is null or p_secret is distinct from v_secret then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  if not private.assistant_hit('visitor:' || left(p_visitor, 64), 20, interval '1 hour') then
    return 'visitor';
  end if;
  if not private.assistant_hit('global', 400, interval '1 day') then
    return 'global';
  end if;
  return 'ok';
end;
$$;

revoke execute on function public.assistant_take_quota(text, text) from public;
grant execute on function public.assistant_take_quota(text, text) to anon, authenticated;

-- Old visitor buckets are useless after their window; sweep them nightly.
select cron.schedule(
  'stoop-assistant-usage-cleanup',
  '30 4 * * *',
  $$delete from private.assistant_usage where bucket <> 'global' and window_start < now() - interval '1 day'$$
);
