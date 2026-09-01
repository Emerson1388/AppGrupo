import { useEffect, useRef, useState } from "react"
import { Trash2, X } from "lucide-react"
import { useApp } from "../context/AppContext"
import type { Story } from "../types"

const DURATION = 5000

type Group = {
  usuarioId: string
  stories: Story[]
}

type Props = {
  groups: Group[]
  startUserId: string
  onClose: () => void
}

export function StoryViewer({ groups, startUserId, onClose }: Props) {
  const { me, profileById, viewStory, deleteStory } = useApp()
  const startIndex = Math.max(0, groups.findIndex((g) => g.usuarioId === startUserId))
  const [gIdx, setGIdx] = useState(startIndex)
  const [sIdx, setSIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const paused = useRef(false)
  const last = useRef(performance.now())
  const downAt = useRef(0)

  const group = groups[gIdx]
  const story = group?.stories[sIdx]
  const who = story ? profileById(story.usuarioId) : undefined

  useEffect(() => {
    if (story) viewStory(story.id)
  }, [story, viewStory])

  useEffect(() => {
    last.current = performance.now()
    setProgress(0)
  }, [gIdx, sIdx])

  function next() {
    if (!group) return
    if (sIdx < group.stories.length - 1) {
      setSIdx((i) => i + 1)
      return
    }
    if (gIdx < groups.length - 1) {
      setGIdx((i) => i + 1)
      setSIdx(0)
      return
    }
    onClose()
  }

  function prev() {
    if (sIdx > 0) {
      setSIdx((i) => i - 1)
      return
    }
    if (gIdx > 0) {
      const prevGroup = groups[gIdx - 1]
      setGIdx((i) => i - 1)
      setSIdx(Math.max(0, prevGroup.stories.length - 1))
    }
  }

  useEffect(() => {
    let frame = 0
    function tick(now: number) {
      const dt = now - last.current
      last.current = now
      if (!paused.current) {
        setProgress((p) => {
          const n = p + dt / DURATION
          if (n >= 1) {
            queueMicrotask(next)
            return 0
          }
          return n
        })
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [gIdx, sIdx, group])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowRight") next()
      if (e.key === "ArrowLeft") prev()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  if (!story || !who || !group) return null

  return (
    <div className="fixed inset-0 z-50 bg-black text-white">
      <div className="absolute inset-x-0 top-0 z-10 flex gap-1 px-3 pt-[max(12px,env(safe-area-inset-top))]">
        {group.stories.map((s, i) => (
          <div key={s.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
            <div
              className="h-full bg-white"
              style={{
                width: i < sIdx ? "100%" : i === sIdx ? `${progress * 100}%` : "0%",
              }}
            />
          </div>
        ))}
      </div>

      <div className="absolute inset-x-0 top-6 z-10 flex items-center justify-between px-4 pt-[max(8px,env(safe-area-inset-top))]">
        <div className="mt-4 flex items-center gap-2">
          <img src={who.fotoUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
          <div>
            <p className="text-sm font-bold">{who.nome.split(" ")[0]}</p>
            <p className="text-[10px] text-white/70">some em 24h</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          {me?.id === story.usuarioId && (
            <button
              type="button"
              onClick={() => {
                deleteStory(story.id)
                onClose()
              }}
              aria-label="Excluir story"
            >
              <Trash2 size={18} />
            </button>
          )}
          <button type="button" onClick={onClose} aria-label="Fechar">
            <X size={22} />
          </button>
        </div>
      </div>

      <img src={story.midiaUrl} alt="" className="h-full w-full object-cover" />
      {story.texto && (
        <p className="absolute inset-x-0 bottom-10 z-10 px-5 text-center text-lg font-semibold drop-shadow">
          {story.texto}
        </p>
      )}

      <button
        type="button"
        className="absolute inset-y-0 left-0 top-20 z-[1] w-1/3"
        aria-label="Anterior"
        onPointerDown={() => {
          paused.current = true
          downAt.current = Date.now()
        }}
        onPointerUp={() => {
          paused.current = false
          if (Date.now() - downAt.current < 280) prev()
        }}
        onPointerLeave={() => {
          paused.current = false
        }}
      />
      <button
        type="button"
        className="absolute inset-y-0 right-0 top-20 z-[1] w-2/3"
        aria-label="Próximo"
        onPointerDown={() => {
          paused.current = true
          downAt.current = Date.now()
        }}
        onPointerUp={() => {
          paused.current = false
          if (Date.now() - downAt.current < 280) next()
        }}
        onPointerLeave={() => {
          paused.current = false
        }}
      />
    </div>
  )
}
