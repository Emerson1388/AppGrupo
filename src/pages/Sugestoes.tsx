import { useApp } from "../context/AppContext"
import { nivelLabel } from "../lib/format"
import type { ReacaoTipo } from "../types"

const reacoes: { tipo: ReacaoTipo; label: string }[] = [
  { tipo: "fiz", label: "👍 Fiz" },
  { tipo: "pesado", label: "🔥 Treino pesado" },
  { tipo: "gostei", label: "💪 Gostei" },
  { tipo: "vou_fazer", label: "🏃 Vou fazer" },
]

export function Sugestoes() {
  const { data, me, reactSugestao, profileById } = useApp()

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Treinador</p>
        <h1 className="font-display text-3xl font-extrabold">Sugestões de treino</h1>
      </div>

      {data.sugestoes.map((s) => {
        const author = profileById(s.criadoPor)
        const mine = data.reacoes.find((r) => r.sugestaoId === s.id && r.usuarioId === me?.id)
        return (
          <article key={s.id} className="rounded-3xl border border-line bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-ember">
              {nivelLabel(s.nivel)}
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold">{s.titulo}</h2>
            <p className="mt-1 text-xs text-muted">por {author?.nome ?? data.grupo.nome}</p>
            <pre className="mt-4 font-sans text-sm leading-relaxed whitespace-pre-wrap text-sand">
              {s.descricao}
            </pre>
            <div className="mt-4 flex flex-wrap gap-2">
              {reacoes.map((r) => (
                <button
                  key={r.tipo}
                  type="button"
                  onClick={() => reactSugestao(s.id, r.tipo)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                    mine?.tipo === r.tipo ? "bg-ember text-on-accent" : "bg-bg text-muted"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </article>
        )
      })}
    </div>
  )
}
