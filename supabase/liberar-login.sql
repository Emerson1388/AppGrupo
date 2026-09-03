-- Cole no SQL Editor do Supabase (uma vez).
-- Confirma os e-mails já cadastrados e os próximos cadastros,
-- para a mesma senha entrar no celular e no computador.

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
