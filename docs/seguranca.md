# Segurança

- Sem `SUPABASE_SERVICE_ROLE_KEY` no frontend.
- RLS ligado. Policies não usam `USING (true)` em dados privados.
- `grupos` tem SELECT público **justificado**: a tela de convite precisa do nome/logo sem login. Treinos, posts e mensagens continuam isolados por `grupo_id`.
- `role` e `grupo_id` não são gravados pelo `updateMe`. Trigger `proteger_perfil` impede alteração pelo cliente.
- Check-in, participação, curtida e comentário só com `usuario_id = auth.uid()`.
- Check-in duplicado: unique `(usuario_id, treino_id)`.
- Janela de check-in também no RPC (`America/Sao_Paulo`).
