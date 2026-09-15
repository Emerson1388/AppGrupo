-- Fecha o cadastro por convite: slug inválido NÃO cai no Plast's Run.
-- Idempotente. Rode depois de 20260914_hardening.sql.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  gid uuid;
  slug text;
begin
  slug := nullif(trim(both from coalesce(new.raw_user_meta_data->>'grupo_slug', '')), '');
  if slug is not null then
    select id into gid from public.grupos where grupos.slug = slug limit 1;
  else
    select id into gid from public.grupos where grupos.slug = 'plasts-run' limit 1;
  end if;

  insert into public.profiles (id, grupo_id, nome, email, nivel, role, meta)
  values (
    new.id,
    gid,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'nivel', 'iniciante'),
    'atleta',
    'Começar e não parar'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
