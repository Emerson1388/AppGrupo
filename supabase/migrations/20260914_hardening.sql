-- Migration incremental. Rode no SQL Editor depois de schema.sql e sync.sql.

-- Convite público precisa ler o grupo pelo slug (nome/logo não são dados privados).
drop policy if exists "ver grupo convite publico" on public.grupos;
create policy "ver grupo convite publico" on public.grupos
  for select using (true);

-- Novos usuários entram sempre como atleta. O grupo vem do metadata de cadastro.
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

-- Promoção manual de admin: execute no SQL Editor. Sem GRANT para o frontend.
create or replace function public.promover_admin(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set role = 'admin'
  where lower(email) = lower(trim(p_email));
end;
$$;

revoke all on function public.promover_admin(text) from public, anon, authenticated;

-- Exclusão da conta do próprio usuário (dados do app). auth.users sobra para limpeza no painel.
create or replace function public.excluir_minha_conta()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;
  delete from public.profiles where id = auth.uid();
end;
$$;

revoke all on function public.excluir_minha_conta() from public;
grant execute on function public.excluir_minha_conta() to authenticated;

-- Storage: bucket público de mídia com pasta por usuário.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'midia',
  'midia',
  true,
  20971520,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "midia leitura publica" on storage.objects;
drop policy if exists "midia upload proprio" on storage.objects;
drop policy if exists "midia update proprio" on storage.objects;
drop policy if exists "midia delete proprio" on storage.objects;

create policy "midia leitura publica"
on storage.objects for select
using (bucket_id = 'midia');

create policy "midia upload proprio"
on storage.objects for insert
with check (
  bucket_id = 'midia'
  and auth.role() = 'authenticated'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "midia update proprio"
on storage.objects for update
using (
  bucket_id = 'midia'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "midia delete proprio"
on storage.objects for delete
using (
  bucket_id = 'midia'
  and auth.uid()::text = (storage.foldername(name))[1]
);
