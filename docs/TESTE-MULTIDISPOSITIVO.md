# Teste multidispositivo — AppGrupo

Data: 15/09/2026  
Ambiente de código: repositório local  
Ambiente de produção: **pendente** até SQL + env + Vercel (`docs/CONFIGURACAO-MANUAL.md`)

Dispositivo A: notebook (Chrome/Edge)  
Dispositivo B: celular (Chrome Android ou Safari) — **outro aparelho**, não o mesmo perfil sincronizado do navegador  
Conta: o mesmo e-mail e a mesma senha nos dois. Não documentar a senha.

## Antes de testar

1. Rodar no SQL Editor, nesta ordem, se ainda não rodou:
   - `supabase/schema.sql` (só banco novo)
   - `supabase/sync.sql`
   - `supabase/migrations/20260914_hardening.sql`
   - `supabase/migrations/20260915_convite_slug.sql`
   - `supabase/migrations/20260916_foto_perfil.sql`
2. Conferir na Vercel: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_PUBLIC_APP_URL`.
3. Redeploy.
4. Abrir a **URL de produção** nos dois aparelhos (não `localhost` no celular contra um banco e produção no notebook).
5. No celular, se o app estiver instalado como PWA antigo: desinstalar ou limpar dados do site para pegar o SW `appgrupo-v4`.

## Foto (obrigatório)

| ID | Passo | Esperado | Resultado |
| --- | --- | --- | --- |
| A | Notebook: login → trocar foto para FOTO A → recarregar | FOTO A | PENDENTE |
| B | Celular: login mesmo e-mail/senha → recarregar | FOTO A | PENDENTE |
| C | Celular: trocar para FOTO B → recarregar | FOTO B | PENDENTE |
| D | Notebook: F5 | FOTO B | PENDENTE |
| E | Outro navegador / terceiro aparelho | FOTO B | PENDENTE |

No Supabase → Table Editor → `profiles.foto_url` deve ser URL de `.../storage/v1/object/public/midia/{uid}/avatars/profile.jpg`, **nunca** `data:image/...`.

## Dados além da foto

| # | Passo | Esperado | Resultado |
| --- | --- | --- | --- |
| 1 | Notebook: cadastro + login | Entra no grupo | PENDENTE |
| 2 | Celular: login mesmo e-mail/senha | Entra **sem** cadastrar de novo | PENDENTE |
| 3 | Notebook altera nome/bio/meta → celular F5 | Texto igual | PENDENTE |
| 4 | Admin cria treino no notebook → celular abre agenda | Treino aparece | PENDENTE |
| 5 | Celular confirma participação → notebook F5 | Participante aparece | PENDENTE |
| 6 | Celular faz check-in na janela | Notebook vê o check-in; duplicata recusada | PENDENTE |
| 7 | Notebook publica no feed → celular F5 | Post aparece | PENDENTE |
| 8 | Celular curte → notebook F5 | Curtida aparece | PENDENTE |
| 9 | Notebook comenta → celular F5 | Comentário aparece | PENDENTE |
| 10 | Notebook logout → celular continua | Celular segue logado | PENDENTE |
| 11 | Celular logout → notebook (se ainda logado) continua | Sessões independentes | PENDENTE |

## Segurança (manual)

- Usuário A não lê mensagens de B.
- Membro do grupo A não vê treinos/posts do grupo B.

Bloqueio tem que vir do **RLS**, não só da UI.

## Sessão

Cada aparelho tem a própria sessão do Supabase Auth. Logout num aparelho **não** deve derrubar o outro. Os **dados** (foto, treinos, feed) vêm do mesmo banco.

## Critério

O app só está **PRONTO** quando A–E e 1–11 estiverem PASS no seu ambiente, com os dois aparelhos no mesmo projeto Supabase.

Enquanto isso: **CÓDIGO OK / PRODUÇÃO PENDENTE**.
