-- Foto de perfil: o usuário só atualiza o próprio registro; Storage upsert só na pasta dele.
-- Role e grupo_id continuam travados pelo trigger proteger_perfil().

drop policy if exists "editar próprio perfil" on public.profiles;
create policy "editar próprio perfil" on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "midia update proprio" on storage.objects;
create policy "midia update proprio"
on storage.objects for update
using (
  bucket_id = 'midia'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'midia'
  and auth.uid()::text = (storage.foldername(name))[1]
);
