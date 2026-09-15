# Supabase

## SQL

1. `supabase/schema.sql` — instalação nova.
2. `supabase/sync.sql` — RLS, RPC de check-in, coluna `distancia_km`.
3. `supabase/migrations/20260914_hardening.sql` — grupo público no convite, usuários sempre atleta, Storage `midia`, `excluir_minha_conta`, `promover_admin`.
4. `supabase/liberar-login.sql` — opcional, confirma e-mails automaticamente.

## Admin inicial

Novos usuários entram como `atleta`. Para promover:

```sql
select public.promover_admin('email@do.treinador');
```

Só no SQL Editor. A função **não** é executável pelo frontend.

## Storage

Bucket público `midia`, pastas `{userId}/avatars|posts|stories/`.
