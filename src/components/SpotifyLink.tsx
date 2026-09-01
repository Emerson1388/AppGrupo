import { useApp } from "../context/AppContext"

function SpotifyMark({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden>
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  )
}

export function toSpotifyWebUrl(raw: string) {
  const value = raw.trim()
  const uri = value.match(/^spotify:(playlist|album|artist|user|folder|show):(.+)$/i)
  if (uri) return `https://open.spotify.com/${uri[1]}/${uri[2]}`
  return value
}

export function SpotifyLink({ compact = false }: { compact?: boolean }) {
  const { data, isStaff, setSpotifyUrl } = useApp()
  const url = data.grupo.spotifyUrl?.trim()

  function onEdit() {
    const next = window.prompt(
      "Cole o link da pasta ou da playlist do Spotify do clube.",
      url ?? "",
    )
    if (next == null) return
    setSpotifyUrl(next.trim())
  }

  if (!url) {
    if (!isStaff) return null
    return (
      <button
        type="button"
        onClick={onEdit}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-line px-3 py-2.5 text-sm font-bold text-muted hover:text-ink"
      >
        <SpotifyMark />
        Colar pasta do Spotify
      </button>
    )
  }

  return (
    <div className={`flex ${compact ? "flex-col gap-1" : "items-center gap-2"}`}>
      <a
        href={toSpotifyWebUrl(url)}
        target="_blank"
        rel="noreferrer"
        className={`inline-flex items-center justify-center gap-2 rounded-xl bg-[#1db954] font-bold text-[#04120a] hover:brightness-110 ${
          compact ? "w-full px-3 py-2.5 text-sm" : "px-4 py-3 text-sm"
        }`}
      >
        <SpotifyMark />
        {compact ? "Spotify" : "Ouvir Os Plast Run"}
      </a>
      {isStaff && (
        <button type="button" onClick={onEdit} className="text-[11px] font-semibold text-muted hover:text-ink">
          Trocar link
        </button>
      )}
    </div>
  )
}
