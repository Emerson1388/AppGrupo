# RunClub

App de clube de corrida — agenda de treinos, check-in, feed e ranking — pensado como SaaS multi-grupo desde o primeiro schema.

A primeira versão roda **sem Supabase**: dados de demonstração do grupo **Plast's Run**, persistidos no navegador. Quando o backend estiver pronto, o SQL em `supabase/schema.sql` já isola cada clube por `grupo_id`.

## Como rodar

```bash
npm install
npm run dev
```

Abra o endereço do Vite (em geral `http://localhost:5173`). Cadastro pelo convite `/g/plasts-run`.

## Publicar para o grupo (Vercel)

Com isso o app fica na internet: qualquer atleta abre o link no celular, sem o seu PC ligado.

1. Crie uma conta em [vercel.com](https://vercel.com) (pode entrar com GitHub).
2. Suba esta pasta para um repositório GitHub **só deste app**.
3. No Vercel: **Add New → Project → Import** o repositório.
4. Deixe o framework **Vite**. Build: `npm run build`. Pasta de saída: `dist`.
5. Se já tiver Supabase, em **Settings → Environment Variables** coloque:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Deploy. O endereço fica `https://algo.vercel.app`.
7. Mande no WhatsApp: `https://SEU-DOMINIO/g/plasts-run`

Rotas do app (`/agenda`, `/corridas`, etc.) e a API de provas (`/api/corridas`) já estão configuradas em `vercel.json`.

No painel do Supabase (Authentication → URL Configuration), acrescente:

- Site URL: `https://SEU-DOMINIO`
- Redirect: `https://SEU-DOMINIO/auth/callback`

**Importante:** hoje cada celular guarda os dados localmente. O site no ar deixa todo mundo **abrir** o app; para o clube inteiro ver o **mesmo** feed e a mesma agenda, ainda é preciso ligar o Supabase (passo abaixo).

### O que já funciona no MVP

1. Login / cadastro no grupo
2. Perfil com km, treinos, presença, publicações, histórico e conquistas
3. Agenda com “Vou participar”
4. Check-in (janela de 45 min antes até 3 h depois) e QR Code do treino
5. Feed com foto, curtida, comentário e exclusão do próprio post
6. Ranking mensal: quilometragem, presença e treinos
7. Sugestões de treino com reações

O treino **Regenerativo** de hoje está na janela de check-in para você testar presença na hora.

## Ligar o Supabase (Opção A)

1. Crie um projeto no [Supabase](https://supabase.com).
2. Rode `supabase/schema.sql` no SQL Editor.
3. Copie `.env.example` para `.env` e preencha:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

4. Crie um bucket de Storage (`midia`) para fotos e vídeos.

O cliente já está em `src/lib/supabase.ts`. O próximo passo é trocar o `AppContext` (hoje localStorage) pelas tabelas reais, sem mudar as telas.

## Arquitetura

```
React + TypeScript + Vite
        ↓
Supabase (Auth, Postgres, Storage)
        ↓
um tenant = um grupo (Plast's Run, Equipe X, …)
```

Planos previstos no schema: gratuito (30 atletas), básico, pro e premium.

## Depois do MVP

GPS e estatísticas, metas, notificações, integração com relógio, recomendação de treino por nível e cobrança SaaS.
