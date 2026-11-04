-- Rode SÓ este arquivo no SQL Editor. Não junta com outros scripts.
-- Confirma as contas que já existem para a senha passar a valer.

update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where email_confirmed_at is null;

update public.profiles p
set grupo_id = g.id
from public.grupos g
where p.grupo_id is null
  and g.slug = 'plasts-run';

create or replace function public.proteger_perfil()
returns trigger
language plpgsql
as $$
begin
  if new.id is distinct from old.id then
    raise exception 'id imutável';
  end if;
  if new.role is distinct from old.role then
    if not exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin' and p.grupo_id = old.grupo_id
    ) then
      new.role := old.role;
    end if;
  end if;
  if new.grupo_id is distinct from old.grupo_id and old.grupo_id is not null then
    new.grupo_id := old.grupo_id;
  end if;
  return new;
end;
$$;
