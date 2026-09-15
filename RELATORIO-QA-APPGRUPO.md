# Relatório QA — AppGrupo

Data: 13/09/2026

## 1. Resumo executivo

O AppGrupo era um MVP em que **a fonte de verdade era o `localStorage` do navegador**. Por isso, uma conta criada no notebook não existia no celular: cada aparelho tinha o seu próprio banco.

A autenticação já tentava o Supabase Auth, mas a hidratação só trazia **grupo + perfis**. Treinos, RSVP, check-ins, feed, curtidas, comentários, mensagens, stories e conquistas continuavam locais. IDs no formato `t_xxxxxxxx` também não cabiam nas colunas UUID do Postgres.

Esta rodada liga o frontend ao Postgres quando `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` existem:

- cadastro / login / logout / sessão via **Supabase Auth**;
- perfil separado do usuário Auth;
- entidades do grupo persistidas e recarregadas do banco;
- check-in na janela real (45 min antes → 3 h depois), com RPC no servidor;
- RLS mais restrito (script SQL para aplicar no projeto);
- F5 não manda o usuário logado de volta ao convite antes da sessão hidratar.

**Ação obrigatória no Supabase (você precisa executar):** cole `supabase/sync.sql` no SQL Editor. Sem isso, o app tenta gravar, mas policies e a coluna `distancia_km` podem faltar. Se o login no celular falhar com “e-mail não confirmado”, rode também `supabase/liberar-login.sql`.

Build, TypeScript e 52 testes unitários passaram nesta máquina. Os testes **A–E entre notebook e celular** ainda precisam ser feitos manualmente depois do SQL e do deploy.

## 2. Arquitetura atual

```text
React + Vite (Vercel)
        ↓
Supabase Auth (sessão do SDK)
        ↓
PostgreSQL + RLS
        ↓
grupos → profiles → treinos / publicacoes / mensagens / stories
              ↓
         participacoes, checkins, curtidas, comentarios
```

Camadas:

| Camada | Onde |
| --- | --- |
| Telas | `src/pages/*`, `src/components/*` |
| Estado | `src/context/AppContext.tsx` |
| Auth / perfil | `src/lib/supabase.ts`, `src/lib/supabaseData.ts` |
| Sync | `src/lib/supabaseSync.ts` |
| Schema | `supabase/schema.sql` + `supabase/sync.sql` |
| Fallback local | `src/lib/accounts.ts` + `runclub.v2` **somente se o Supabase não estiver configurado** |

Classificação de storage:

| Chave | Classe | Destino |
| --- | --- | --- |
| `runclub.theme` | A — pode ficar local | preferência visual |
| aviso de cookies | A | preferência |
| sessão Supabase (SDK) | A | gerenciada pelo Auth |
| `runclub.v2` | B | **não é mais escrito** com Supabase ligado |
| `runclub.accounts.v2` | B | só no modo demo sem nuvem |

Não há `sessionStorage` nem IndexedDB no código da aplicação.

## 3. Problemas encontrados

### P0 — crítico

- Login/cadastro no notebook não existiam no celular (`localStorage`).
- Hidratação incompleta: só grupo e perfis iam ao banco.
- IDs `uid("t")` incompatíveis com UUID.
- `runclub.v2` continuava sendo a persistência mesmo com Auth na nuvem.
- RLS frouxo: `reacoes_sugestao` com `using (true)`; `participacoes`/`checkins`/`curtidas`/`comentarios` com `for all`; `story_views` sem policy; `usuario_conquistas` sem INSERT.
- Confirmação de e-mail do Supabase bloqueia o segundo aparelho se `liberar-login.sql` não tiver sido rodado.
- F5 em rota privada podia redirecionar ao convite antes de `getSession()`.

### P1 — alto

- Check-in aberto o dia inteiro se a data fosse “hoje”.
- Feed/agenda/ranking dependiam de dados locais.
- QR validado só no cliente.
- Foto de perfil e mídia de post ainda como data URL (não Storage).

### P2 — médio

- Sem UI de editar/excluir treino (policies de staff já no SQL).
- Uploads sem bucket `midia` nem limite de MIME no Storage.
- Lint de Fast Refresh / `setState` em effects (não bloqueia).
- Sem Playwright E2E.

### P3 — baixo

- Bundle JS ~617 kB.
- Avisos de impureza (`Date.now` em stories).

## 4. Bugs corrigidos

- Sessão e perfil passam a vir do Auth + `profiles`.
- Hidratação completa do grupo no login e no `onAuthStateChange`.
- Mutações de RSVP, check-in, treino, post, like, comentário, mensagem, reação, story e badges gravam no Postgres.
- IDs novos na nuvem usam `crypto.randomUUID()`.
- `authReady` + `SessionGate` evitam o flash de deslogado no F5.
- Janela de check-in alinhada à regra 45 min / 3 h.
- RPC `fazer_checkin` / `fazer_checkin_por_token` valida janela, grupo e duplicata no banco.
- Mensagens de erro de Auth/API deixam de vazar `PGRST` / `AuthApiError` para o usuário.
- Exclusão de post/story só do próprio autor, também no cliente.

## 5. Bugs pendentes

- SQL `sync.sql` ainda não aplicado no projeto remoto (depende de você).
- Confirmação de e-mail pode continuar bloqueando o celular.
- Fotos grandes em data URL podem falhar ou deixar o banco pesado.
- Sem Storage (`midia`) nem políticas de bucket.
- Sem edição/exclusão de treino na interface.
- Testes multidispositivo A–E não executados daqui.
- Sem suíte Playwright.

## 6. Severidade de cada bug

Ver tabela da seção 7.

## 7. Alterações realizadas

| ID | Problema | Severidade | Status | Arquivo | Correção |
| --- | --- | --- | --- | --- | --- |
| P0-01 | Conta só no aparelho | P0 | Corrigido no código | `AppContext.tsx`, `supabase.ts` | Auth + sessão do SDK; sem gravar `runclub.v2` na nuvem |
| P0-02 | Hidratação incompleta | P0 | Corrigido no código | `supabaseSync.ts` | `hydrateGroupData` carrega todas as entidades do grupo |
| P0-03 | IDs locais no UUID | P0 | Corrigido | `supabaseSync.ts`, `AppContext.tsx` | `newEntityId()` |
| P0-04 | RLS aberto / incompleto | P0 | SQL pronto | `supabase/sync.sql` | Policies restritas + trigger de perfil |
| P0-05 | F5 perde sessão na UI | P0 | Corrigido | `App.tsx`, `AppContext.tsx` | `authReady` + SessionGate |
| P0-06 | E-mail não confirmado | P0 | Pendente (config) | `supabase/liberar-login.sql` | Rodar no SQL Editor se quiser login imediato |
| P1-01 | Check-in o dia todo | P1 | Corrigido | `format.ts` | Só a janela 45 min / 3 h |
| P1-02 | Check-in só no cliente | P1 | Corrigido no código | `sync.sql`, `supabaseSync.ts` | RPC no Postgres |
| P1-03 | Feed/agenda/ranking locais | P1 | Corrigido no código | `AppContext.tsx` | Persist + hydrate |
| P1-04 | Post/foto de outro usuário | P1 | Corrigido | `AppContext.tsx`, RLS | Delete só do autor |
| P1-05 | Coluna km do post | P1 | SQL pronto | `schema.sql`, `sync.sql` | `publicacoes.distancia_km` |
| P2-01 | Storage de mídia | P2 | Pendente | — | Criar bucket `midia` no painel |
| P2-02 | Editar/apagar treino na UI | P2 | Pendente | — | Policies já previstas |
| P2-03 | E2E Playwright | P2 | Pendente | — | Vitest cobre unidade/componente |
| P3-01 | Lint Fast Refresh | P3 | Aceito | vários | Sem impacto funcional |

## 8. Banco de dados

Tabelas já existentes (não recriadas):

`grupos`, `profiles`, `treinos`, `participacoes`, `checkins`, `publicacoes`, `curtidas`, `comentarios`, `sugestoes_treino`, `reacoes_sugestao`, `conquistas`, `usuario_conquistas`, `mensagens`, `stories`, `story_views`.

Relacionamentos:

```text
auth.users 1—1 profiles → grupos
treinos 1—N participacoes / checkins  (único user+treino)
publicacoes 1—N curtidas / comentarios  (único user+post nas curtidas)
```

Inclusão: `publicacoes.distancia_km`.

Constraint de check-in duplicado: `unique (usuario_id, treino_id)` já existia.

## 9. RLS e segurança

RLS permanece **ligado**. `sync.sql` não desabilita políticas para “fazer funcionar”.

Regras aplicadas no script:

- perfil: ver colegas do grupo; editar/apagar só o próprio; role/grupo_id protegidos por trigger;
- posts: insert no próprio grupo; delete só do autor;
- comentários/curtidas: insert/delete só `auth.uid()`;
- treinos: criar/editar/apagar só admin/treinador;
- participações/check-ins: insert só da própria presença;
- reações: deixam de ser `using (true)`;
- mensagens: ler conversa própria; enviar como remetente; marcar lida só o destinatário;
- `story_views`: select do grupo + insert da própria view;
- badges: insert só do próprio usuário;
- RPC de check-in: `security definer` + `auth.uid()` + `meu_grupo_id()`.

O frontend **não** contém `SUPABASE_SERVICE_ROLE_KEY`. Só a anon/publishable key.

## 10. Autenticação

| Ação | API |
| --- | --- |
| Cadastro | `supabase.auth.signUp()` |
| Login | `supabase.auth.signInWithPassword()` |
| Logout | `supabase.auth.signOut()` |
| Sessão | `getSession()`, `getUser()`, `onAuthStateChange()` |

Senha, token e usuário completo **não** são gravados manualmente no `localStorage`.

O modo local (`accounts.ts` + PBKDF2) só existe se as env vars do Supabase estiverem vazias, ou para migrar uma conta antiga no primeiro login na nuvem.

Rotas públicas: `/login`, `/cadastro`, `/verificar-email`, `/confirmar-email`, `/esqueci-senha`, `/redefinir-senha`, `/auth/callback`, `/privacidade`, `/termos`, `/g/:slug`.

Rotas privadas (Guard): `/`, `/agenda`, `/corridas`, `/ranking`, `/perfil`, `/feed` implícito em `/`, mensagens, membros, novo treino, check-in QR.

Logado em `/login` ou `/cadastro` → redireciona para o app.

## 11. Responsividade

O layout (Tailwind, `min-h-svh`, cards, grid 2 colunas no detalhe do treino) não foi redesenhado. Não houve auditoria visual completa em 320–1440 px nesta rodada. Prioridade foi funcionamento e persistência. Vale testar no Android/iPhone depois do deploy, sobretudo QR, teclado e o botão de check-in.

## 12. Testes realizados

```text
npm test   → 52 passed (10 arquivos)
npm run build → tsc -b + vite build OK
npm run lint → sem erro; só warnings
```

Cobertura automática: senha, formatação, janela de check-in (08:14 bloqueado … 12:01 bloqueado), contas locais, mensagens de erro, API de corridas, PWA, Login, Convite, Agenda, UUID de entidade.

Os testes unitários **desligam** o Supabase (`vite.config.ts` `test.env`) para não depender da nuvem e para o modo demo local continuar testável.

## 13. Testes que ainda precisam ser executados manualmente

Depois de rodar `sync.sql` (e o deploy na Vercel):

**Teste A** — notebook: cadastro → logout.

**Teste B** — celular: login com o mesmo e-mail/senha → deve entrar.

**Teste C** — celular altera perfil → notebook vê o perfil atualizado.

**Teste D** — celular cria post → notebook abre o feed e vê o post.

**Teste E** — notebook confirma treino → celular vê a presença na agenda.

Também: F5 em `/agenda`, `/perfil`, `/ranking`, `/`; QR válido/inválido/fora da janela; check-in 08:15 vs 12:01; tentar apagar post de outra pessoa.

## 14. Variáveis de ambiente necessárias

No frontend / Vercel (tipo **Config**, não Secret):

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_PUBLIC_APP_URL   (opcional; link do QR no celular)
```

**Nunca** coloque `SUPABASE_SERVICE_ROLE_KEY` na Vercel do frontend.

Não alterei o arquivo `.env` real.

## 15. Deploy

- `vercel.json`: Vite, rewrite SPA, `api/corridas.ts` com `maxDuration` 30.
- Node `24.x` no `package.json`.
- Após o push: conferir as três `VITE_*` no projeto Vercel.
- No Supabase → Authentication → URL Configuration:
  - Site URL = domínio de produção
  - Redirects: `http://localhost:5173/auth/callback` e `https://SEU-DOMINIO/auth/callback`
  - Reset de senha: `/redefinir-senha`

## 16. Riscos conhecidos

1. Se `sync.sql` não for executado, inserts podem falhar (coluna/policy/RPC). O app cai no fallback de insert direto quando a função ainda não existe, mas o RLS antigo pode recusar ou ficar permissivo demais.
2. Foto/vídeo em data URL estoura limite de linha ou payload.
3. Timezone do check-in no banco é `America/Sao_Paulo`; o cliente usa o relógio do aparelho. Em outro fuso a janela pode divergir por minutos.
4. Primeiro usuário do grupo vira admin (`handle_new_user`). Os seguintes são atletas.
5. Contas criadas só no `localStorage` antigo não existem na nuvem até um login de migração (signUp + senha local) ou um cadastro novo.
6. Isolamento multi-grupo depende de `grupo_id` + `meu_grupo_id()`. Hoje o cadastro entra no slug `plasts-run`.

## 17. Recomendações futuras

1. Bucket Storage `midia` (imagem/vídeo, tamanho e MIME) e gravar URL em vez de data URL.
2. Playwright no fluxo Cadastro → Login → Agenda → Check-in → Feed → Ranking → Logout.
3. Telas de editar/excluir treino para staff.
4. Observabilidade: falhas de persist não podem ficar só no console.
5. Segundo grupo real para validar isolamento A/B.
6. Confirmação de e-mail oficial (em vez do auto-confirm) quando o clube estiver estável.
7. Compactar o bundle e revisar stories/QR em 320 px.

---

## Critério de aceite (estado agora)

### Autenticação

```text
[x] Cadastro usa signUp (código)
[x] Login usa signInWithPassword (código)
[x] Logout usa signOut (código)
[x] Sessão persiste via SDK (código)
[ ] Notebook → celular  (manual + SQL)
[ ] Celular → notebook  (manual + SQL)
```

### Dados

```text
[x] Perfil / treinos / check-ins / feed / curtidas / comentários / ranking
    passam pelo service → Supabase (código)
[ ] Confirmação visual no segundo aparelho (manual)
```

### Segurança

```text
[x] Script com RLS ativo e policies restritas
[ ] Script aplicado no projeto Supabase
[x] Service role fora do frontend
```

### Qualidade

```text
[x] Build
[x] TypeScript
[x] Lint sem erro crítico
[x] 52 testes
[ ] QA manual multidispositivo
```
