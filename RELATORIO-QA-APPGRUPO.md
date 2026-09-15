# Relatório QA — AppGrupo (rodada 2.0)

Data: 14/09/2026

## 1. Resumo executivo

O AppGrupo deixou de tratar o navegador como banco. Com Supabase configurado:

- cadastro/login/logout e sessão vêm do **Supabase Auth**;
- senha **não** é alterada com `trim()`;
- o grupo do convite `/g/:slug` é resolvido dinamicamente;
- novos usuários entram como **atleta** (admin só via SQL);
- treinos, RSVP, check-in, feed, likes, comentários, mensagens e stories gravam no Postgres;
- ranking mensal usa **somente check-in de treino**;
- fotos vão para o bucket `midia` quando o Storage estiver criado.

Backup Git: `5c32260` (`backup antes das correcoes AppGrupo`).

**Você precisa rodar no SQL Editor, nesta ordem:**

1. `supabase/schema.sql` (se o projeto for novo)
2. `supabase/sync.sql`
3. `supabase/migrations/20260914_hardening.sql`
4. Opcional: `supabase/liberar-login.sql`
5. `select public.promover_admin('seu@email');` para o treinador

## 2. Arquitetura

```text
React + Vite
    → AppContext (UI / sessão)
    → services + supabaseSync
    → Supabase Auth / Postgres / Storage
    → RLS
```

`localStorage` permanece só para tema e cookies. Contas locais (`accounts.ts`) só no modo demo, sem env do Supabase.

## 3. Problemas encontrados

### P0
- Senha com `password.trim()`
- Login local ainda tentava gravar conta na nuvem
- Primeiro usuário virava admin (corrida)
- Slug `plasts-run` hardcoded no cadastro/guard
- Ranking somava km digitado no post
- Persist sem checar `error`
- Hidratação misturava mock
- Convite anônimo não lia o grupo no banco

### P1
- Foto/story em data URL
- Exclusão de conta = só signOut
- Reset de senha local + nuvem ao mesmo tempo
- Sem empty states
- Admin automático no `ensureProfile`

### P2
- Sem pasta `docs/`
- PWA cache antigo
- Overflow em telas estreitas

## 4. Problemas corrigidos

Ver tabela da seção 16 (casos) e a tabela abaixo.

## 5. Problemas pendentes

- SQL/Storage/redirects no **painel** (instruções em `docs/CONFIGURACAO-MANUAL.md`)
- Teste notebook ↔ celular em aparelhos reais (`docs/TESTE-MULTIDISPOSITIVO.md`)
- `auth.users` não some no delete (só o perfil)
- Playwright E2E de dois dispositivos reais (não simular com o mesmo localStorage)


## 6. Segurança

Service role fora do frontend. Role/grupo_id protegidos no cliente e no trigger. Policies separadas (SELECT/INSERT/UPDATE/DELETE). SELECT público em `grupos` é só convite (nome/logo).

## 7. RLS

Atualizado em `sync.sql` + `20260914_hardening.sql`. Sem desligar RLS.

## 8. Autenticação

`signUp` / `signInWithPassword` / `signOut` / `getSession` / `getUser` / `onAuthStateChange`. Reset oficial (`resetPasswordForEmail` + `updateUser`). Sem `trim` na senha.

## 9. Banco de dados

Mesmas tabelas. Novos: RPC `excluir_minha_conta`, `promover_admin`, `handle_new_user` sempre atleta + `grupo_slug`.

## 10. Storage

Bucket `midia` com pastas `avatars/`, `posts/`, `stories/`. MIME e tamanho validados no cliente. Policies por pasta do `auth.uid()`.

## 11. Mobile

`overflow-x-hidden` no layout/convite. QR usa o slug do convite. Service worker `appgrupo-v3` (não fica preso no cache v2).

## 12. Vercel

Sem mudança estrutural. Variáveis `VITE_*` como Config. Nunca service role.

## 13. Testes

Executar `npm test`, `npm run build`, `npm run lint` nesta rodada.

## 14. Casos de teste

Manuais A–E (e 1–7 do prompt) depois do SQL. Unidade: janela de check-in, ranking sem post-km, slug, MIME, login/agenda/convite.

## 15. Riscos

1. Sem `hardening.sql`, Storage e convite público falham.
2. Sem `promover_admin`, ninguém cria treino.
3. Timezone do RPC: `America/Sao_Paulo`.
4. Delete não remove o usuário Auth.
5. Contas só locais antigas não entram na nuvem sozinhas — cadastro/login oficiais.

## 16. Melhorias futuras

Playwright, segundo grupo real, confirmação de e-mail oficial, Edge Function para apagar `auth.users`, compactar bundle.

| ID | Problema | Severidade | Status | Arquivo | Solução |
| --- | --- | --- | --- | --- | --- |
| P0-01 | Senha com trim | P0 | Corrigido | `AppContext.tsx` | `const pass = password` |
| P0-02 | Auth local na nuvem | P0 | Corrigido | `AppContext.tsx` | Login/cadastro/reset só Auth se env existir |
| P0-03 | Admin automático | P0 | Corrigido | `schema.sql`, migration | Sempre atleta + `promover_admin` |
| P0-04 | Grupo fixo | P0 | Corrigido | `inviteSlug.ts`, `Convite.tsx` | `/g/:slug` + metadata |
| P0-05 | Ranking por post | P0 | Corrigido | `rankingService.ts` | Só check-in |
| P0-06 | Persist ignora error | P0 | Corrigido | `supabaseSync.ts` | Retorna erro amigável |
| P1-01 | Data URL | P1 | Corrigido no código | `mediaService.ts` | Upload Storage |
| P1-02 | Delete = logout | P1 | Corrigido no código | RPC `excluir_minha_conta` | Apaga perfil e cascata |
| P1-03 | Mock na nuvem | P1 | Corrigido | `supabaseSync.ts` | Sem fallback de mock |
| P2-01 | PWA cache | P2 | Corrigido | `public/sw.js` | `appgrupo-v3` |

### Critério de aceite (código vs. produção)

```text
[x] cadastro/login/logout/sessão no código
[ ] notebook ↔ celular (manual)
[x] dados passam por service → Supabase
[x] ranking sem post social
[x] RLS script pronto
[ ] RLS aplicado no projeto
[x] Storage script + upload no código
[ ] bucket criado no painel/SQL
[x] build/lint/testes unitários
```
