# Arquitetura

O AppGrupo é um SPA React + TypeScript (Vite) com Supabase Auth, PostgreSQL e Storage.

```text
UI → AppContext → services / supabaseSync → Supabase → Postgres + RLS
```

- Autenticação: somente Supabase Auth quando as env vars existem.
- Dados de negócio: Postgres. `localStorage` só para tema e cookies.
- Multi-grupo: cadastro grava `grupo_slug` no metadata; o convite `/g/:slug` define o grupo.
- Ranking mensal: quilometragem de **check-in em treino**, nunca de post social.
