# Teste multidispositivo — AppGrupo

Data: 14/09/2026  
Ambiente de código: repositório local (Vitest + build verdes)  
Ambiente de produção: **pendente da configuração no painel** (ver `docs/CONFIGURACAO-MANUAL.md`)

Dispositivo A: notebook (Chrome/Edge)  
Dispositivo B: celular (Chrome Android ou Safari iPhone) — **outro aparelho**, não o mesmo perfil sincronizado  
Usuário: conta de teste criada no cadastro (não documentar senha)

## Como executar

1. Aplicar o SQL e as env vars (`CONFIGURACAO-MANUAL.md`).
2. Abrir a URL de produção no notebook e no celular.
3. Não usar a mesma sessão sincronizada do navegador.

## Roteiro e resultado

| # | Passo | Esperado | Resultado |
| --- | --- | --- | --- |
| 1 | Notebook: cadastro + login | Entra no grupo | PENDENTE (manual) |
| 2 | Celular: login mesmo e-mail/senha | LOGIN COM SUCESSO, sem novo cadastro | PENDENTE (manual) |
| 3 | Notebook altera nome → celular recarrega (F5) | Nome igual | PENDENTE (manual) |
| 4 | Celular altera bio → notebook F5 | Bio igual | PENDENTE (manual) |
| 5 | Admin cria treino no notebook → celular abre agenda | Treino aparece | PENDENTE (manual) |
| 6 | Celular confirma presença → notebook F5 | Participante aparece | PENDENTE (manual) |
| 7 | Check-in na janela / duplicado / fora da janela | Só um check-in válido | PENDENTE (manual) |
| 8 | Notebook publica → celular abre feed | Post aparece | PENDENTE (manual) |
| 9 | Celular curte → notebook F5 | Curtida aparece | PENDENTE (manual) |
| 10 | Celular comenta → notebook F5 | Comentário aparece | PENDENTE (manual) |
| 11 | Foto de perfil | URL do Storage, não `data:image` | PENDENTE (manual) |
| 12 | `/g/plasts-run` vs `/g/invalido` | Só o válido cadastra | Código: PASS (Vitest). Produção: PENDENTE |
| 13 | Logout + F5 em `/agenda` | Volta ao convite/login | PENDENTE (manual) |

## Falhas

Nenhuma falha de código bloqueante nesta data. O teste 1–11 **não foi executado em aparelhos reais nesta sessão** — não há como o agente abrir seu celular.

## Critério

O app só está **PRONTO** quando as linhas 1–11 desta tabela estiverem PASS no seu ambiente, com os dois aparelhos falando com o mesmo Supabase.
