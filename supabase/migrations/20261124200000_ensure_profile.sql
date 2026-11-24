-- ============================================
-- Some accounts (e.g. a Google sign-in) ended up without a user_profiles row,
-- and the home page showed "finish profile setup". Backfill the missing rows
-- and let the app create its own profile when it is missing.
-- ============================================

begin;

-- 1. Profiles for every existing account that has none
insert into public.user_profiles (id)
select u.id from auth.users u
where not exists (select 1 from public.user_profiles p where p.id = u.id);

-- 2. Self-heal: the signed-in user creates their own profile if it is missing.
--    Only for themselves (auth.uid()), never overwrites an existing row.
create or replace function public.ensure_profile(p_interface_language public.interface_lang default null)
returns public.user_profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.user_profiles;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  insert into public.user_profiles (id)
  values (auth.uid())
  on conflict (id) do nothing;

  if p_interface_language is not null then
    update public.user_profiles
       set interface_language = p_interface_language
     where id = auth.uid() and created_at > now() - interval '1 minute';
  end if;

  select * into result from public.user_profiles where id = auth.uid();
  return result;
end;
$$;
revoke execute on function public.ensure_profile(public.interface_lang) from public, anon;
grant execute on function public.ensure_profile(public.interface_lang) to authenticated;

commit;
