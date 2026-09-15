import { useEffect, useState } from "react"
import { Link, Navigate, useParams } from "react-router-dom"
import { useApp } from "../context/AppContext"
import { Logo } from "../components/Logo"
import { ThemeToggle } from "../components/ThemeToggle"
import { PhoneAccess } from "../components/PhoneAccess"
import { SpotifyLink } from "../components/SpotifyLink"
import { rememberInviteSlug } from "../lib/inviteSlug"
import { fetchGrupoBySlug } from "../services/groupService"
import { supabaseEnabled } from "../lib/supabase"
import type { Grupo } from "../types"

export function Convite() {
  const { slug } = useParams()
  const { me, data } = useApp()
  const [remoto, setRemoto] = useState<Grupo | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [loading, setLoading] = useState(Boolean(supabaseEnabled && slug))

  useEffect(() => {
    if (!slug) return
    rememberInviteSlug(slug)
    if (!supabaseEnabled) {
      setLoading(false)
      return
    }
    let cancel = false
    setLoading(true)
    setErro(null)
    setRemoto(null)
    void fetchGrupoBySlug(slug).then((grupo) => {
      if (cancel) return
      setLoading(false)
      if (!grupo) setErro("Este convite não corresponde a um grupo.")
      else setRemoto(grupo)
    })
    return () => {
      cancel = true
    }
  }, [slug])

  const grupo = supabaseEnabled ? remoto : data.grupo
  const ok = Boolean(grupo && (!slug || slug === grupo.slug))

  if (me) return <Navigate to="/" replace />

  return (
    <div className="relative min-h-svh overflow-x-hidden bg-bg px-5 py-10 text-ink">
      <div className="absolute right-5 top-5 w-48 max-w-[40vw]">
        <ThemeToggle />
      </div>
      <div className="mx-auto flex min-h-[80svh] w-full max-w-md flex-col justify-center pt-8">
        <Logo className="h-28 w-auto sm:h-32" />
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-ember">
          Convite do grupo
        </p>
        <h1 className="mt-2 font-display text-4xl font-extrabold leading-none">
          {loading ? "Carregando…" : ok && grupo ? grupo.nome : "Grupo"}
        </h1>
        {loading ? (
          <p className="mt-3 text-sand">Buscando o convite do grupo…</p>
        ) : erro || !ok ? (
          <p className="mt-3 text-sand">
            {erro ?? "Este convite não corresponde a um grupo. Confira o link."}
          </p>
        ) : (
          <p className="mt-3 text-sand">
            Entre com este link e você vira membro: agenda de treinos, check-in, feed e mensagens
            privadas com o clube.
          </p>
        )}
        {ok && !loading && (
          <Link
            to="/cadastro"
            className="mt-8 rounded-xl bg-ember py-3 text-center text-sm font-bold text-on-accent"
          >
            Entrar como membro
          </Link>
        )}
        {ok && !loading && (
          <>
            <div className="mt-4">
              <SpotifyLink />
            </div>
            <div className="mt-6">
              <PhoneAccess />
            </div>
          </>
        )}
        <p className="mt-4 text-center text-sm text-muted">
          Já faz parte?{" "}
          <Link to="/login" className="font-semibold text-lime">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
