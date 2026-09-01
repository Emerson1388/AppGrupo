import { Link } from "react-router-dom"
import { AuthShell } from "../components/AuthShell"

export function Termos() {
  return (
    <AuthShell>
      <h1 className="mt-6 font-display text-3xl font-extrabold">Termos de uso</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-sand">
        <p>
          O aplicativo é o ambiente digital do grupo Plast's Run. Ao criar conta, você declara ter
          18 anos ou o consentimento do responsável, e concorda em usar o espaço com respeito.
        </p>
        <p>
          É proibido publicar conteúdo ofensivo, de terceiros sem autorização ou que viole a lei.
          O administrador pode remover conteúdo e encerrar contas em caso de abuso.
        </p>
        <p>
          Check-in e treinos são organizados pelo clube. A prática de corrida é por sua conta e
          risco; o app não substitui avaliação médica.
        </p>
        <p>
          Você pode encerrar a conta a qualquer momento em Perfil → Excluir conta.
        </p>
      </div>
      <Link to="/cadastro" className="mt-8 inline-block text-sm font-semibold text-lime">
        Voltar
      </Link>
    </AuthShell>
  )
}
