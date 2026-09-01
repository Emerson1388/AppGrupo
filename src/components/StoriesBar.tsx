import { useMemo, useState } from "react"
import { Plus } from "lucide-react"
import { useApp } from "../context/AppContext"
import { StoryViewer } from "./StoryViewer"
import type { Story } from "../types"

function resizeStory(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("falha"))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error("imagem"))
      img.onload = () => {
        const max = 1080
        const scale = Math.min(1, max / Math.max(img.width, img.height))
        const canvas = document.createElement("canvas")
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          resolve(String(reader.result))
          return
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL("image/jpeg", 0.8))
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

export function StoriesBar() {
  const { data, me, addStory, profileById } = useApp()
  const [openUser, setOpenUser] = useState<string | null>(null)

  const live = useMemo(
    () => data.stories.filter((s) => new Date(s.expiresAt).getTime() > Date.now()),
    [data.stories],
  )

  const groups = useMemo(() => {
    if (!me) return []
    const byUser = new Map<string, Story[]>()
    for (const s of [...live].sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))) {
      const list = byUser.get(s.usuarioId) ?? []
      list.push(s)
      byUser.set(s.usuarioId, list)
    }
    const ids = [...byUser.keys()]
    ids.sort((a, b) => {
      if (a === me.id) return -1
      if (b === me.id) return 1
      const aSeen = (byUser.get(a) ?? []).every((s) => s.viewedBy.includes(me.id))
      const bSeen = (byUser.get(b) ?? []).every((s) => s.viewedBy.includes(me.id))
      if (aSeen !== bSeen) return aSeen ? 1 : -1
      return 0
    })
    return ids.map((usuarioId) => ({ usuarioId, stories: byUser.get(usuarioId) ?? [] }))
  }, [live, me])

  async function onAdd(file: File | undefined) {
    if (!file) return
    const midiaUrl = await resizeStory(file)
    addStory({ midiaUrl })
  }

  if (!me) return null

  const mine = groups.find((g) => g.usuarioId === me.id)

  return (
    <>
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-[72px] shrink-0 flex-col items-center gap-1">
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                if (mine) setOpenUser(me.id)
              }}
              className={`rounded-full p-[2px] ${
                mine
                  ? mine.stories.every((s) => s.viewedBy.includes(me.id))
                    ? "bg-line"
                    : "bg-[linear-gradient(135deg,var(--ember),var(--lime))]"
                  : "bg-line"
              }`}
            >
              <img
                src={me.fotoUrl}
                alt=""
                className="h-[64px] w-[64px] rounded-full border-2 border-bg object-cover"
              />
            </button>
            <label className="absolute right-0 bottom-0 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-ember text-on-accent ring-2 ring-bg">
              <Plus size={14} />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => void onAdd(e.target.files?.[0])}
              />
            </label>
          </div>
          <span className="w-full truncate text-center text-[11px] font-semibold">Seu story</span>
        </div>

        {groups
          .filter((g) => g.usuarioId !== me.id)
          .map((g) => {
            const who = profileById(g.usuarioId)
            if (!who) return null
            const seen = g.stories.every((s) => s.viewedBy.includes(me.id))
            return (
              <button
                key={g.usuarioId}
                type="button"
                onClick={() => setOpenUser(g.usuarioId)}
                className="flex w-[72px] shrink-0 flex-col items-center gap-1"
              >
                <span
                  className={`rounded-full p-[2px] ${
                    seen ? "bg-line" : "bg-[linear-gradient(135deg,var(--ember),var(--lime))]"
                  }`}
                >
                  <img
                    src={who.fotoUrl}
                    alt=""
                    className="h-[64px] w-[64px] rounded-full border-2 border-bg object-cover"
                  />
                </span>
                <span className="w-full truncate text-center text-[11px] font-semibold">
                  {who.nome.split(" ")[0]}
                </span>
              </button>
            )
          })}
      </div>

      {openUser && (
        <StoryViewer
          groups={groups.filter((g) => g.stories.length > 0)}
          startUserId={openUser}
          onClose={() => setOpenUser(null)}
        />
      )}
    </>
  )
}
