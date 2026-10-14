-- RLS helpers don't belong in the exposed API schema.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;
alter function public.is_conversation_participant(uuid) set schema private;
