# Relatório QA final — AppGrupo

Data: 15/09/2026

## STATUS GERAL

**CÓDIGO OK / PRODUÇÃO PENDENTE**

Não está **PRONTO** até o notebook e o celular usarem o **mesmo e-mail, a mesma senha e o mesmo projeto Supabase**, com o SQL aplicado.

O código, com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` presentes, trata Auth + Postgres + Storage como única fonte de verdade. O agente **não** executou o roteiro em dois aparelhos reais nesta sessão.

## Causa raiz (ainda visível no código anterior)

1. Login na nuvem podia cair em `verifyLogin()` local se o Auth não devolvesse `user` sem mensagem de erro.
2. `hydrateGroupData()` transformava erro de RLS/rede/coluna em `[]` — um aparelho parecia vazio, o outro cheio.
3. Cadastro de perfil sem convite escolhia `grupos.limit(20)[0]` — grupo diferente por dispositivo.
4. Mutações (post, like, treino, RSVP) atualizavam o React **antes** do Postgres; se o INSERT falhasse, só aquele aparelho via o dado.
5. Service Worker `appgrupo-v3` podia devolver o logo do clube no lugar de uma imagem do Storage em rede instável (celular).

## Matriz

| Funcionalidade | Frontend | Supabase | RLS | Status |
| --- | --- | --- | --- | --- |
| Auth | só `signInWithPassword` se nuvem ligada | Auth | n/a | CÓDIGO OK |
| Perfil / foto | Storage `profile.jpg` → `foto_url` → hydrate | profiles + midia | próprio update | CÓDIGO OK |
| Treinos | persist depois estado | treinos | staff insert | CÓDIGO OK |
| Presença | persist depois estado | participacoes | usuario_id = uid | CÓDIGO OK |
| Check-in | RPC; QR não cai no mock | checkins | próprio insert | CÓDIGO OK |
| Feed / like / comentário | persist depois estado | publicacoes/curtidas/comentarios | próprio | CÓDIGO OK |
| Storage | `midia/{uid}/avatars/profile.jpg` | bucket midia | pasta do uid | CÓDIGO OK / CONFIG |
| Hydrate | erro vira `[SYNC ERROR]`, não lista vazia | todas as tabelas do grupo | grupo_id | CÓDIGO OK |
| Convite | slug do metadata; sem “primeiro grupo” | grupos | convite | CÓDIGO OK |
| Ranking | só check-in | checkins + treinos | leitura do grupo | CÓDIGO OK |

## SQL

| Arquivo | Papel | No repositório | No projeto remoto |
| --- | --- | --- | --- |
| `supabase/schema.sql` | instalação nova | presente | **pendente** se o projeto já existia; rode só se for banco novo |
| `supabase/sync.sql` | RLS fina + RPC check-in | presente | **pendente até você confirmar no SQL Editor** |
| `supabase/migrations/20260914_hardening.sql` | Storage `midia`, atleta, admin SQL | presente | **pendente até confirmar** |
| `supabase/migrations/20260915_convite_slug.sql` | convite | presente | **pendente até confirmar** |
| `supabase/migrations/20260916_foto_perfil.sql` | upsert foto + WITH CHECK | presente | **pendente até confirmar** |
| `supabase/liberar-login.sql` | confirma e-mail em dev | presente | opcional |

Este agente **não** tem acesso ao SQL Editor do seu projeto. “SQL já aplicado” só você pode marcar.

## BUILD / TESTES

Rodar nesta máquina: `npm test`, `npm run lint`, `npm run build`.

Playwright em dois aparelhos: não. Seria falso se compartilhasse o mesmo `localStorage`.

## localStorage

| Ocorrência | Classe |
| --- | --- |
| tema | A — permitido |
| cookies | A — permitido |
| `runclub.v2` | só se Supabase **não** estiver nas env |
| contas locais (`accounts.ts`) | só modo demo / Vitest |
| sessão Auth do SDK | por aparelho, não é dado de negócio |
| invite slug | sessionStorage, convite temporário |
| Data URL / blob | preview da foto **antes** do upload; não grava em `foto_url` |

## Bugs restantes

1. Teste notebook ↔ celular ainda não executado em hardware.
2. SQL/Storage/redirects/Vercel env dependem do painel.
3. Delete de conta não remove `auth.users`.
4. Sem SQL de foto/Storage, o upload falha de forma visível (não há mais “sucesso falso” local).
