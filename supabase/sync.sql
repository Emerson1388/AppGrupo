-- Incremental: rode no SQL Editor do projeto existente (depois de schema.sql).
-- Não desabilita RLS. Ajusta colunas, policies e validação de check-in no banco.

alter table public.publicacoes
  add column if not exists distancia_km numeric(6, 2);

-- Perfil: ninguém troca o próprio role/grupo/id pelo cliente.
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
  if new.grupo_id is distinct from old.grupo_id then
    new.grupo_id := old.grupo_id;
  end if;
  return new;
end;
$$;

drop trigger if exists proteger_perfil on public.profiles;
create trigger proteger_perfil
  before update on public.profiles
  for each row execute procedure public.proteger_perfil();

drop policy if exists "apagar próprio perfil" on public.profiles;
create policy "apagar próprio perfil" on public.profiles
  for delete using (id = auth.uid());

-- Treinos: staff edita/exclui.
drop policy if exists "admin edita treino" on public.treinos;
create policy "admin edita treino" on public.treinos
  for update using (
    grupo_id = public.meu_grupo_id()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'treinador')
    )
  );

drop policy if exists "admin apaga treino" on public.treinos;
create policy "admin apaga treino" on public.treinos
  for delete using (
    grupo_id = public.meu_grupo_id()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'treinador')
    )
  );

-- Participações: só o próprio usuário confirma/cancela.
drop policy if exists "participacoes do grupo" on public.participacoes;
drop policy if exists "ver participacoes do grupo" on public.participacoes;
drop policy if exists "confirmar propria presenca" on public.participacoes;
drop policy if exists "cancelar propria presenca" on public.participacoes;

create policy "ver participacoes do grupo" on public.participacoes
  for select using (
    exists (
      select 1 from public.treinos t
      where t.id = treino_id and t.grupo_id = public.meu_grupo_id()
    )
  );

create policy "confirmar propria presenca" on public.participacoes
  for insert with check (
    usuario_id = auth.uid()
    and exists (
      select 1 from public.treinos t
      where t.id = treino_id and t.grupo_id = public.meu_grupo_id()
    )
  );

create policy "cancelar propria presenca" on public.participacoes
  for delete using (usuario_id = auth.uid());

-- Check-ins: leitura do grupo, inserção só da própria presença.
drop policy if exists "checkins do grupo" on public.checkins;
drop policy if exists "ver checkins do grupo" on public.checkins;
drop policy if exists "registrar proprio checkin" on public.checkins;

create policy "ver checkins do grupo" on public.checkins
  for select using (
    exists (
      select 1 from public.treinos t
      where t.id = treino_id and t.grupo_id = public.meu_grupo_id()
    )
  );

create policy "registrar proprio checkin" on public.checkins
  for insert with check (
    usuario_id = auth.uid()
    and exists (
      select 1 from public.treinos t
      where t.id = treino_id and t.grupo_id = public.meu_grupo_id()
    )
  );

-- Curtidas / comentários: sem apagar o de outra pessoa.
drop policy if exists "curtidas" on public.curtidas;
drop policy if exists "ver curtidas" on public.curtidas;
drop policy if exists "curtir" on public.curtidas;
drop policy if exists "descurtir" on public.curtidas;

create policy "ver curtidas" on public.curtidas
  for select using (
    exists (
      select 1 from public.publicacoes p
      where p.id = publicacao_id and p.grupo_id = public.meu_grupo_id()
    )
  );

create policy "curtir" on public.curtidas
  for insert with check (usuario_id = auth.uid());

create policy "descurtir" on public.curtidas
  for delete using (usuario_id = auth.uid());

drop policy if exists "comentarios" on public.comentarios;
drop policy if exists "ver comentarios" on public.comentarios;
drop policy if exists "comentar" on public.comentarios;
drop policy if exists "apagar proprio comentario" on public.comentarios;

create policy "ver comentarios" on public.comentarios
  for select using (
    exists (
      select 1 from public.publicacoes p
      where p.id = publicacao_id and p.grupo_id = public.meu_grupo_id()
    )
  );

create policy "comentar" on public.comentarios
  for insert with check (usuario_id = auth.uid() and char_length(trim(texto)) between 1 and 2000);

create policy "apagar proprio comentario" on public.comentarios
  for delete using (usuario_id = auth.uid());

-- Reações de sugestão: não abertas para o mundo.
drop policy if exists "reacoes" on public.reacoes_sugestao;
drop policy if exists "ver reacoes" on public.reacoes_sugestao;
drop policy if exists "reagir" on public.reacoes_sugestao;
drop policy if exists "trocar reacao" on public.reacoes_sugestao;
drop policy if exists "tirar reacao" on public.reacoes_sugestao;

create policy "ver reacoes" on public.reacoes_sugestao
  for select using (
    exists (
      select 1 from public.sugestoes_treino s
      where s.id = sugestao_id and s.grupo_id = public.meu_grupo_id()
    )
  );

create policy "reagir" on public.reacoes_sugestao
  for insert with check (usuario_id = auth.uid());

create policy "trocar reacao" on public.reacoes_sugestao
  for update using (usuario_id = auth.uid());

create policy "tirar reacao" on public.reacoes_sugestao
  for delete using (usuario_id = auth.uid());

-- Conquistas desbloqueadas.
drop policy if exists "ganhar badge" on public.usuario_conquistas;
create policy "ganhar badge" on public.usuario_conquistas
  for insert with check (usuario_id = auth.uid());

-- Stories views.
drop policy if exists "ver views do grupo" on public.story_views;
drop policy if exists "registrar view" on public.story_views;

create policy "ver views do grupo" on public.story_views
  for select using (
    exists (
      select 1 from public.stories s
      where s.id = story_id and s.grupo_id = public.meu_grupo_id()
    )
  );

create policy "registrar view" on public.story_views
  for insert with check (usuario_id = auth.uid());

-- Mensagens: envio só como remetente; leitura só da própria conversa.
drop policy if exists "mensagens próprias" on public.mensagens;
drop policy if exists "ler mensagens" on public.mensagens;
drop policy if exists "enviar mensagem" on public.mensagens;
drop policy if exists "marcar lida" on public.mensagens;

create policy "ler mensagens" on public.mensagens
  for select using (de_id = auth.uid() or para_id = auth.uid());

create policy "enviar mensagem" on public.mensagens
  for insert with check (de_id = auth.uid());

create policy "marcar lida" on public.mensagens
  for update using (para_id = auth.uid())
  with check (para_id = auth.uid());

-- Check-in no servidor: 45 min antes até 3 h depois (horário de Brasília).
create or replace function public.janela_checkin(p_data date, p_horario time)
returns boolean
language sql
stable
as $$
  select timezone('America/Sao_Paulo', now())
    between (p_data + p_horario) - interval '45 minutes'
        and (p_data + p_horario) + interval '3 hours'
$$;

create or replace function public.fazer_checkin(p_treino_id uuid, p_metodo text default 'manual')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  t public.treinos%rowtype;
  cid uuid;
begin
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;
  if p_metodo not in ('manual', 'qr') then
    raise exception 'Método inválido';
  end if;

  select * into t
  from public.treinos
  where id = p_treino_id and grupo_id = public.meu_grupo_id();

  if not found then
    raise exception 'Treino não encontrado';
  end if;

  if not public.janela_checkin(t.data, t.horario) then
    raise exception 'Check-in fora da janela';
  end if;

  if exists (
    select 1 from public.checkins
    where usuario_id = auth.uid() and treino_id = p_treino_id
  ) then
    raise exception 'Presença já registrada';
  end if;

  insert into public.checkins (usuario_id, treino_id, status, metodo)
  values (auth.uid(), p_treino_id, 'presente', p_metodo)
  returning id into cid;

  insert into public.participacoes (usuario_id, treino_id)
  values (auth.uid(), p_treino_id)
  on conflict do nothing;

  return jsonb_build_object('id', cid, 'treino_id', p_treino_id);
end;
$$;

create or replace function public.fazer_checkin_por_token(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  tid uuid;
begin
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;
  if p_token is null or length(trim(p_token)) < 8 then
    raise exception 'QR inválido';
  end if;

  select id into tid
  from public.treinos
  where qr_token = trim(p_token) and grupo_id = public.meu_grupo_id();

  if tid is null then
    raise exception 'QR inválido';
  end if;

  return public.fazer_checkin(tid, 'qr');
end;
$$;

revoke all on function public.fazer_checkin(uuid, text) from public;
revoke all on function public.fazer_checkin_por_token(text) from public;
grant execute on function public.fazer_checkin(uuid, text) to authenticated;
grant execute on function public.fazer_checkin_por_token(text) to authenticated;
