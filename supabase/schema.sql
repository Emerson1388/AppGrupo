-- RunClub · schema inicial (multi-tenant)
-- Cole no SQL Editor do Supabase depois de criar o projeto.

create extension if not exists "pgcrypto";

create table if not exists public.grupos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text unique not null,
  logo_url text,
  cidade text,
  spotify_url text,
  plano text not null default 'gratuito' check (plano in ('gratuito', 'basico', 'pro', 'premium')),
  limite_atletas int not null default 30,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  grupo_id uuid references public.grupos (id) on delete set null,
  nome text not null,
  email text,
  foto_url text,
  data_nascimento date,
  distancia_preferida text,
  pace_medio text,
  nivel text not null default 'iniciante' check (nivel in ('iniciante', 'intermediario', 'avancado')),
  meta text,
  bio text,
  role text not null default 'atleta' check (role in ('atleta', 'treinador', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.treinos (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references public.grupos (id) on delete cascade,
  titulo text not null,
  tipo text not null default 'livre',
  descricao text,
  data date not null,
  horario time not null,
  local text not null,
  distancia_km numeric(6, 2) not null default 0,
  pace_sugerido text,
  nivel text not null default 'iniciante' check (nivel in ('iniciante', 'intermediario', 'avancado')),
  observacoes text,
  treinador_id uuid references public.profiles (id),
  qr_token text unique not null default encode(gen_random_bytes(12), 'hex'),
  criado_por uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists public.participacoes (
  usuario_id uuid not null references public.profiles (id) on delete cascade,
  treino_id uuid not null references public.treinos (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (usuario_id, treino_id)
);

create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.profiles (id) on delete cascade,
  treino_id uuid not null references public.treinos (id) on delete cascade,
  data_hora timestamptz not null default now(),
  status text not null default 'presente',
  metodo text not null default 'manual' check (metodo in ('manual', 'qr')),
  unique (usuario_id, treino_id)
);

create table if not exists public.publicacoes (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references public.grupos (id) on delete cascade,
  usuario_id uuid not null references public.profiles (id) on delete cascade,
  texto text not null default '',
  midia_url text,
  tipo text not null default 'texto' check (tipo in ('foto', 'video', 'texto')),
  created_at timestamptz not null default now()
);

create table if not exists public.curtidas (
  usuario_id uuid not null references public.profiles (id) on delete cascade,
  publicacao_id uuid not null references public.publicacoes (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (usuario_id, publicacao_id)
);

create table if not exists public.comentarios (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.profiles (id) on delete cascade,
  publicacao_id uuid not null references public.publicacoes (id) on delete cascade,
  texto text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.sugestoes_treino (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references public.grupos (id) on delete cascade,
  titulo text not null,
  descricao text not null,
  nivel text not null default 'iniciante' check (nivel in ('iniciante', 'intermediario', 'avancado')),
  criado_por uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists public.reacoes_sugestao (
  usuario_id uuid not null references public.profiles (id) on delete cascade,
  sugestao_id uuid not null references public.sugestoes_treino (id) on delete cascade,
  tipo text not null check (tipo in ('fiz', 'pesado', 'gostei', 'vou_fazer')),
  primary key (usuario_id, sugestao_id)
);

create table if not exists public.conquistas (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  titulo text not null,
  descricao text,
  icone text
);

create table if not exists public.usuario_conquistas (
  usuario_id uuid not null references public.profiles (id) on delete cascade,
  conquista_id uuid not null references public.conquistas (id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (usuario_id, conquista_id)
);

alter table public.grupos enable row level security;
alter table public.profiles enable row level security;
alter table public.treinos enable row level security;
alter table public.participacoes enable row level security;
alter table public.checkins enable row level security;
alter table public.publicacoes enable row level security;
alter table public.curtidas enable row level security;
alter table public.comentarios enable row level security;
alter table public.sugestoes_treino enable row level security;
alter table public.reacoes_sugestao enable row level security;
alter table public.conquistas enable row level security;
alter table public.usuario_conquistas enable row level security;

create or replace function public.meu_grupo_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select grupo_id from public.profiles where id = auth.uid()
$$;

create policy "ver grupo" on public.grupos
  for select using (
    id = public.meu_grupo_id()
    or (auth.role() = 'authenticated' and slug = 'plasts-run')
  );

create policy "admin edita grupo" on public.grupos
  for update using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.grupo_id = grupos.id and p.role in ('admin', 'treinador')
    )
  );

create policy "ver próprio perfil" on public.profiles
  for select using (id = auth.uid());

create policy "ver colegas" on public.profiles
  for select using (grupo_id = public.meu_grupo_id());

create policy "editar próprio perfil" on public.profiles
  for update using (id = auth.uid());

create policy "inserir próprio perfil" on public.profiles
  for insert with check (id = auth.uid());

create policy "treinos do grupo" on public.treinos
  for select using (grupo_id = public.meu_grupo_id());

create policy "admin cria treino" on public.treinos
  for insert with check (
    grupo_id = public.meu_grupo_id()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'treinador')
    )
  );

create policy "participacoes do grupo" on public.participacoes
  for all using (
    exists (
      select 1 from public.treinos t
      where t.id = treino_id and t.grupo_id = public.meu_grupo_id()
    )
  );

create policy "checkins do grupo" on public.checkins
  for all using (
    exists (
      select 1 from public.treinos t
      where t.id = treino_id and t.grupo_id = public.meu_grupo_id()
    )
  );

create policy "feed do grupo" on public.publicacoes
  for select using (grupo_id = public.meu_grupo_id());

create policy "publicar no grupo" on public.publicacoes
  for insert with check (grupo_id = public.meu_grupo_id() and usuario_id = auth.uid());

create policy "apagar o próprio post" on public.publicacoes
  for delete using (usuario_id = auth.uid());

create policy "curtidas" on public.curtidas
  for all using (
    exists (
      select 1 from public.publicacoes p
      where p.id = publicacao_id and p.grupo_id = public.meu_grupo_id()
    )
  );

create policy "comentarios" on public.comentarios
  for all using (
    exists (
      select 1 from public.publicacoes p
      where p.id = publicacao_id and p.grupo_id = public.meu_grupo_id()
    )
  );

create policy "sugestoes" on public.sugestoes_treino
  for select using (grupo_id = public.meu_grupo_id());

create policy "reacoes" on public.reacoes_sugestao
  for all using (true);

create policy "ver conquistas" on public.conquistas
  for select using (true);

create policy "ver badges" on public.usuario_conquistas
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = usuario_id and p.grupo_id = public.meu_grupo_id()
    )
  );

create table if not exists public.mensagens (
  id uuid primary key default gen_random_uuid(),
  de_id uuid not null references public.profiles (id) on delete cascade,
  para_id uuid not null references public.profiles (id) on delete cascade,
  texto text not null,
  lida boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.mensagens enable row level security;

create policy "mensagens próprias" on public.mensagens
  for all using (de_id = auth.uid() or para_id = auth.uid());

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references public.grupos (id) on delete cascade,
  usuario_id uuid not null references public.profiles (id) on delete cascade,
  midia_url text not null,
  texto text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.story_views (
  story_id uuid not null references public.stories (id) on delete cascade,
  usuario_id uuid not null references public.profiles (id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (story_id, usuario_id)
);

alter table public.stories enable row level security;
alter table public.story_views enable row level security;

create policy "stories do grupo" on public.stories
  for select using (grupo_id = public.meu_grupo_id() and expires_at > now());

create policy "criar próprio story" on public.stories
  for insert with check (grupo_id = public.meu_grupo_id() and usuario_id = auth.uid());

create policy "apagar próprio story" on public.stories
  for delete using (usuario_id = auth.uid());

insert into public.conquistas (codigo, titulo, descricao, icone) values
  ('primeiro_treino', 'Primeiro treino', 'Você apareceu. O resto é consistência.', '🏅'),
  ('10_treinos', '10 treinos', 'Dez check-ins no grupo.', '🔥'),
  ('50_km', '50 km acumulados', 'Meio caminho de muita história.', '🏃'),
  ('100_km', '100 km acumulados', 'Três dígitos no relógio do clube.', '🏃‍♂️'),
  ('100_presenca', '100% no mês', 'Confirmou e apareceu em todos.', '💯'),
  ('primeiro_lugar', 'Topo do ranking', 'Liderou um ranking do mês.', '🥇'),
  ('treino_noturno', 'Coruja', 'Check-in depois das 18h.', '🌙'),
  ('treino_manha', 'Madrugador', 'Check-in antes das 8h.', '🌅')
on conflict (codigo) do nothing;

insert into public.grupos (nome, slug, cidade, plano, limite_atletas, spotify_url)
values (
  'Plast''s Run',
  'plasts-run',
  'Porto Alegre',
  'pro',
  80,
  'https://open.spotify.com/playlist/2utm3JSul3RuVyao2Q4xD0'
)
on conflict (slug) do nothing;

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
