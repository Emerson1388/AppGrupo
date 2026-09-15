# Relatório QA final — AppGrupo

Data: 14/09/2026

## STATUS GERAL

**PRONTO PARA TESTE REAL MULTIDISPOSITIVO** — não declarado **PRONTO** até o notebook e o celular usarem a mesma conta no seu Supabase.

O código trata o Postgres como fonte de verdade. O que falta para o critério absoluto é: (1) rodar o SQL no painel, (2) você executar o roteiro em dois aparelhos.

## Matriz

| Funcionalidade | Frontend | Supabase | RLS | Status |
| --- | --- | --- | --- | --- |
| Auth | signUp / signIn / signOut / sessão SDK | Auth | n/a | PASS (código) |
| Perfil | Context → saveProfilePatch | profiles | próprio update; role/grupo_id protegidos | PASS (código) |
| Treinos | persistTreino | treinos | staff insert | PASS (código) |
| Presença | persistRsvp | participacoes | usuario_id = uid | PASS (código) |
| Check-in | RPC + janela 45 min / 3 h | checkins unique | próprio insert | PASS (código) |
| Feed | persistPost | publicacoes | próprio insert/delete | PASS (código) |
| Curtidas | persistLike | curtidas PK | próprio | PASS (código) |
| Comentários | persistComment | comentarios | próprio | PASS (código) |
| Storage | mediaService | bucket midia | pasta do uid | PASS (código) / CONFIG no painel |
| Convite | `/g/:slug` + metadata | grupos SELECT público | slug inválido não cadastra | PASS (código) |
| Ranking | computeMonthlyRanking | check-ins + treinos | leitura do grupo | PASS (código) |

## Severidade

```text
P0: nenhum aberto no código. Pendência = aplicar SQL + teste em dois aparelhos.
P1: auth.users não é apagado no delete (só o perfil). Documentado.
P2: bundle JS > 500 kB; auditoria visual 320–1440 px não refeita.
P3: Playwright E2E não adicionado (evita teste falso com o mesmo localStorage).
```

## AUTENTICAÇÃO: PASS (código) / MANUAL (aparelhos)

signUp, signInWithPassword, signOut, getSession, getUser, onAuthStateChange. Sem trim na senha. Sem auth local em produção.

## PERFIL: PASS (código) / MANUAL (aparelhos)

F5 e foco da janela rehidratam do banco.

## TREINOS: PASS (código) / MANUAL (aparelhos)

## PRESENÇA: PASS (código) / MANUAL (aparelhos)

## CHECK-IN: PASS (código) / MANUAL (aparelhos)

Duplicata e janela no RPC.

## FEED: PASS (código) / MANUAL (aparelhos)

data URL recusada no persist.

## CURTIDAS: PASS (código) / MANUAL (aparelhos)

## COMENTÁRIOS: PASS (código) / MANUAL (aparelhos)

## STORAGE: PASS (código) / CONFIG

Bucket e policies no SQL `20260914_hardening.sql`.

## CONVITE: PASS (código)

Slug inválido não mostra cadastro. Metadata inválido não cai no Plast's Run.

## RLS: PASS (script) / CONFIG

Não desligado. Aplicar `sync.sql` + hardening no projeto.

## MOBILE: PASS parcial

overflow-x-hidden, QR com slug do convite. Teste visual em iPhone/Android ainda manual.

## VERCEL: PASS (configuração descrita)

Não inventamos valores. Ver `docs/CONFIGURACAO-MANUAL.md`.

## BUILD: PASS

## TESTES: PASS (56+ Vitest nesta rodada; conferir comando)

Playwright multidispositivo: não. Seria falso se compartilhasse localStorage.

## localStorage

| Ocorrência | Classe |
| --- | --- |
| tema | A — permitido |
| cookies | A — permitido |
| `runclub.v2` | só se Supabase **não** estiver nas env |
| contas locais | só modo demo/testes |
| invite slug | sessionStorage, preferência de convite |

## Bugs restantes

1. Teste notebook ↔ celular ainda não executado em hardware.
2. SQL/Storage/redirects dependem do painel.
3. Delete de conta não remove `auth.users` (precisa do painel Auth).
