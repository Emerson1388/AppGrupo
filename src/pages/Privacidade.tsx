import { Link } from "react-router-dom"
import { AuthShell } from "../components/AuthShell"

export function Privacidade() {
  return (
    <AuthShell>
      <h1 className="mt-6 font-display text-3xl font-extrabold">Política de Privacidade</h1>
      <p className="mt-1 text-xs text-muted">LGPD · Lei nº 13.709/2018 · Plast's Run</p>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-sand">
        <p>
          O Plast's Run trata dados pessoais para organizar treinos, presença, feed e mensagens do
          grupo. Base legal principal: consentimento (art. 7º, I).
        </p>
        <p>
          <strong className="text-ink">Dados:</strong> nome, e-mail, foto, nível, treinos, check-ins,
          publicações, stories e mensagens. A senha é guardada só como hash (PBKDF2), nunca em texto.
        </p>
        <p>
          <strong className="text-ink">Uso:</strong> autenticar membros, publicar agenda, registrar
          presença e permitir conversa no clube. Não vendemos dados.
        </p>
        <p>
          <strong className="text-ink">Seus direitos:</strong> acesso, correção, exclusão,
          portabilidade e revogação do consentimento (art. 18). No perfil: exportar dados ou apagar a
          conta.
        </p>
        <p>
          <strong className="text-ink">Retenção:</strong> enquanto a conta existir. Ao excluir, os
          dados pessoais da conta são removidos deste aplicativo.
        </p>
        <p>
          Com Supabase configurado, autenticação e confirmação de e-mail passam pelo provedor. Sem
          isso, os dados ficam só neste dispositivo.
        </p>
      </div>
      <Link to="/cadastro" className="mt-8 inline-block text-sm font-semibold text-lime">
        Voltar
      </Link>
    </AuthShell>
  )
}
