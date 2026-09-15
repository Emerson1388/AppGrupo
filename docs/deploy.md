# Deploy (Vercel)

Variáveis (tipo Config, não Secret):

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_PUBLIC_APP_URL
```

Nunca coloque a service role key.

Supabase Auth → URL Configuration:

- Site URL = domínio de produção
- Redirects: `http://localhost:5173/auth/callback` e `https://SEU-DOMINIO/auth/callback`
- Reset de senha: `https://SEU-DOMINIO/redefinir-senha`

Framework Vite. `vercel.json` já faz rewrite SPA e a API `/api/corridas`.
