# Configuração manual — AppGrupo

Nunca cole `SUPABASE_SERVICE_ROLE_KEY` no frontend nem na Vercel deste app.

## 1. Supabase → SQL Editor

Rode **nesta ordem**, um arquivo por vez:

1. `supabase/schema.sql` — só se o projeto for novo (não apaga dados).
2. `supabase/sync.sql` — RLS, RPC de check-in, coluna `distancia_km`.
3. `supabase/migrations/20260914_hardening.sql` — convite público, Storage `midia`, usuários sempre atleta, `promover_admin`, `excluir_minha_conta`.
4. `supabase/migrations/20260915_convite_slug.sql` — convite inválido **não** entra no Plast's Run.
5. `supabase/migrations/20260916_foto_perfil.sql` — upsert da foto só na pasta do usuário + update do próprio `profiles`.
6. Opcional: `supabase/liberar-login.sql` se o segundo aparelho recusar “e-mail não confirmado”.

## 2. Promover o treinador

```sql
select public.promover_admin('email-do-treinador@dominio.com');
```

Sem isso, ninguém cria treino (só atleta).

## 3. Storage

O SQL do passo 3 cria o bucket `midia` e as policies. Confira em Storage:

- Bucket: `midia` (público para leitura)
- Upload só autenticado, pasta `{userId}/avatars|posts|stories/`
- Foto de perfil oficial: `{userId}/avatars/profile.jpg` → `profiles.foto_url`

Se o insert em `storage.buckets` falhar por permissão, crie o bucket `midia` no painel (público, 20 MB, MIME: jpeg/png/webp/gif/mp4/webm) e rode de novo só as policies de `storage.objects` do arquivo `20260914_hardening.sql`.

## 4. Authentication → URL Configuration

- Site URL: domínio de produção (ex.: `https://SEU-PROJETO.vercel.app`)
- Redirect URLs:
  - `http://localhost:5173/auth/callback`
  - `https://SEU-PROJETO.vercel.app/auth/callback`
  - `http://localhost:5173/redefinir-senha`
  - `https://SEU-PROJETO.vercel.app/redefinir-senha`

## 5. Vercel → Environment Variables (tipo Config)

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_PUBLIC_APP_URL
```

`VITE_PUBLIC_APP_URL` = URL pública do app (para o QR do celular). **As variáveis `VITE_*` entram no JavaScript na hora do build.** Depois de salvar na Vercel, faça Redeploy. Sem isso o celular cai no modo demo e parece que a conta “não existe neste aparelho”.

## 6. Conferência rápida

- Cadastro no notebook → login.
- Mesmo e-mail/senha no celular → entra **sem** cadastrar de novo.
- `/g/plasts-run` mostra o grupo; `/g/nao-existe` **não** oferece cadastro.
- Trocar a foto no notebook → recarregar no celular → **a mesma foto**.
