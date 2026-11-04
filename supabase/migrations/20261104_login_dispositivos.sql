-- Login em qualquer aparelho: e-mail já vale como confirmado e perfil sem grupo pode receber o Plast's Run.
-- Idempotente. Não apaga dados.

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
