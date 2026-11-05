-- Cadastro: o Auth não pode abortar se o perfil falhar.
-- handle_new_user continua security definer (não abre RLS).
-- Idempotente. Não apaga usuários nem dados.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  gid uuid;
  slug text;
  v_nivel text;
  v_nome text;
begin
  slug := nullif(trim(both from coalesce(new.raw_user_meta_data->>'grupo_slug', '')), '');
  if slug is not null then
    select id into gid from public.grupos where grupos.slug = slug limit 1;
  else
    select id into gid from public.grupos where grupos.slug = 'plasts-run' limit 1;
  end if;

  v_nivel := coalesce(nullif(trim(both from coalesce(new.raw_user_meta_data->>'nivel', '')), ''), 'iniciante');
  if v_nivel not in ('iniciante', 'intermediario', 'avancado') then
    v_nivel := 'iniciante';
  end if;

  v_nome := nullif(trim(both from coalesce(new.raw_user_meta_data->>'nome', '')), '');
  if v_nome is null then
    v_nome := split_part(coalesce(new.email, 'atleta'), '@', 1);
  end if;

  insert into public.profiles (id, grupo_id, nome, email, nivel, role, meta)
  values (
    new.id,
    gid,
    v_nome,
    new.email,
    v_nivel,
    'atleta',
    'Começar e não parar'
  )
  on conflict (id) do nothing;

  return new;
exception
  when others then
    raise warning 'handle_new_user: %', sqlerrm;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.confirm_user_email()
returns trigger
language plpgsql
security definer
set search_path = auth, public
as $$
begin
  new.email_confirmed_at := coalesce(new.email_confirmed_at, now());
  return new;
exception
  when others then
    return new;
end;
$$;

drop trigger if exists confirm_user_email on auth.users;
create trigger confirm_user_email
  before insert on auth.users
  for each row execute procedure public.confirm_user_email();
