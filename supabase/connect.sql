-- Rodar no SQL Editor se o schema.sql já tiver sido aplicado antes.
-- Idempotente o suficiente para repetir.

-- Evita loop infinito nas políticas RLS (stack depth exceeded).
create or replace function public.meu_grupo_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select grupo_id from public.profiles where id = auth.uid()
$$;

alter table public.profiles add column if not exists email text;
alter table public.grupos add column if not exists spotify_url text;

insert into public.grupos (nome, slug, cidade, plano, limite_atletas, spotify_url)
values (
  'Plast''s Run',
  'plasts-run',
  'Porto Alegre',
  'pro',
  80,
  'https://open.spotify.com/playlist/2utm3JSul3RuVyao2Q4xD0'
)
on conflict (slug) do update set
  spotify_url = excluded.spotify_url,
  cidade = excluded.cidade,
  plano = excluded.plano;

drop policy if exists "ver grupo" on public.grupos;
create policy "ver grupo" on public.grupos
  for select using (
    id = public.meu_grupo_id()
    or (auth.role() = 'authenticated' and slug = 'plasts-run')
  );

drop policy if exists "admin edita grupo" on public.grupos;
create policy "admin edita grupo" on public.grupos
  for update using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.grupo_id = grupos.id and p.role in ('admin', 'treinador')
    )
  );

drop policy if exists "ver próprio perfil" on public.profiles;
create policy "ver próprio perfil" on public.profiles
  for select using (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  gid uuid;
  n_admin int;
  new_role text;
begin
  select id into gid from public.grupos where slug = 'plasts-run' limit 1;
  select count(*) into n_admin from public.profiles where grupo_id = gid and role = 'admin';
  new_role := case when coalesce(n_admin, 0) = 0 then 'admin' else 'atleta' end;
  insert into public.profiles (id, grupo_id, nome, email, nivel, role, meta)
  values (
    new.id,
    gid,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'nivel', 'iniciante'),
    new_role,
    'Começar e não parar'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where email_confirmed_at is null;

create or replace function public.confirm_user_email()
returns trigger
language plpgsql
security definer
set search_path = auth, public
as $$
begin
  new.email_confirmed_at := coalesce(new.email_confirmed_at, now());
  return new;
end;
$$;

drop trigger if exists confirm_user_email on auth.users;
create trigger confirm_user_email
  before insert on auth.users
  for each row execute procedure public.confirm_user_email();
