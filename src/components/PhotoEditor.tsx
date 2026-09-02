import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react"
import {
  Check,
  Contrast,
  FlipHorizontal,
  RotateCw,
  SlidersHorizontal,
  Smile,
  Sun,
  Trash2,
  Type,
  X,
} from "lucide-react"
import { uid } from "../lib/format"

type Tab = "ajustar" | "texto" | "emoji"

type Overlay = {
  id: string
  kind: "emoji" | "text"
  value: string
  x: number
  y: number
  scale: number
  color: string
}

type Adjust = {
  rotate: number
  flipX: boolean
  zoom: number
  brightness: number
  contrast: number
}

const EMOJIS = [
  "🔥",
  "💪",
  "🏃",
  "🏃‍♀️",
  "🏅",
  "🥇",
  "👟",
  "💚",
  "⚡",
  "😎",
  "🏆",
  "👊",
  "✨",
  "❤️",
  "😂",
  "😍",
  "🙌",
  "💦",
  "🌅",
  "🏔️",
  "🎯",
  "⭐",
  "💥",
  "🫡",
  "🫶",
  "🎉",
]

const COLORS = ["#ffffff", "#050805", "#39ff14", "#b8ff3d", "#ff4d4d", "#ffd60a"]

const INITIAL_ADJUST: Adjust = {
  rotate: 0,
  flipX: false,
  zoom: 1,
  brightness: 1,
  contrast: 1,
}

type Props = {
  src: string
  onCancel: () => void
  onDone: (dataUrl: string) => void
}

export function PhotoEditor({ src, onCancel, onDone }: Props) {
  const stageRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null)
  const [adjust, setAdjust] = useState<Adjust>(INITIAL_ADJUST)
  const [overlays, setOverlays] = useState<Overlay[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>("ajustar")
  const [draftText, setDraftText] = useState("")
  const [textColor, setTextColor] = useState("#ffffff")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  function addEmoji(value: string) {
    const item: Overlay = {
      id: uid("ov"),
      kind: "emoji",
      value,
      x: 50,
      y: 50,
      scale: 1,
      color: "#ffffff",
    }
    setOverlays((list) => [...list, item])
    setSelected(item.id)
  }

  function addText() {
    const value = draftText.trim()
    if (!value) return
    const item: Overlay = {
      id: uid("ov"),
      kind: "text",
      value,
      x: 50,
      y: 72,
      scale: 1,
      color: textColor,
    }
    setOverlays((list) => [...list, item])
    setSelected(item.id)
    setDraftText("")
  }

  function onPointerDown(e: PointerEvent<HTMLButtonElement>, item: Overlay) {
    const box = stageRef.current?.getBoundingClientRect()
    if (!box) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    setSelected(item.id)
    drag.current = {
      id: item.id,
      dx: (e.clientX - box.left) / box.width * 100 - item.x,
      dy: (e.clientY - box.top) / box.height * 100 - item.y,
    }
  }

  function onPointerMove(e: PointerEvent<HTMLButtonElement>) {
    const box = stageRef.current?.getBoundingClientRect()
    const d = drag.current
    if (!box || !d) return
    const x = Math.min(94, Math.max(6, (e.clientX - box.left) / box.width * 100 - d.dx))
    const y = Math.min(94, Math.max(6, (e.clientY - box.top) / box.height * 100 - d.dy))
    setOverlays((list) => list.map((o) => (o.id === d.id ? { ...o, x, y } : o)))
  }

  function onPointerUp() {
    drag.current = null
  }

  const active = overlays.find((o) => o.id === selected)

  async function confirm() {
    setSaving(true)
    try {
      onDone(await bakePhoto(src, adjust, overlays))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <header className="flex items-center justify-between px-4 py-3">
        <button type="button" onClick={onCancel} className="rounded-full p-2 text-muted" aria-label="Cancelar">
          <X size={22} />
        </button>
        <p className="text-sm font-bold">Editar foto</p>
        <button
          type="button"
          onClick={() => void confirm()}
          disabled={saving}
          className="inline-flex items-center gap-1 rounded-full bg-ember px-3 py-1.5 text-xs font-bold text-on-accent disabled:opacity-60"
        >
          <Check size={14} />
          {saving ? "Salvando…" : "Usar foto"}
        </button>
      </header>

      <div className="flex min-h-0 flex-1 items-center justify-center px-4">
        <div
          ref={stageRef}
          className="relative aspect-[4/5] w-full max-h-[min(62vh,560px)] overflow-hidden rounded-2xl bg-black"
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) setSelected(null)
          }}
        >
          <img
            src={src}
            alt=""
            draggable={false}
            onPointerDown={() => setSelected(null)}
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              transform: `scale(${adjust.zoom}) rotate(${adjust.rotate}deg) scaleX(${adjust.flipX ? -1 : 1})`,
              filter: `brightness(${adjust.brightness}) contrast(${adjust.contrast})`,
            }}
          />
          {overlays.map((item) => (
            <button
              key={item.id}
              type="button"
              onPointerDown={(e) => onPointerDown(e, item)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              className={`absolute -translate-x-1/2 -translate-y-1/2 touch-none select-none whitespace-nowrap ${
                selected === item.id ? "rounded-lg ring-2 ring-ember" : ""
              }`}
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                color: item.color,
                fontSize: item.kind === "emoji" ? `${28 * item.scale}px` : `${22 * item.scale}px`,
                fontWeight: 800,
                textShadow: item.kind === "text" ? "0 1px 4px rgba(0,0,0,.7)" : undefined,
              }}
            >
              {item.value}
            </button>
          ))}
        </div>
      </div>

      {active && (
        <div className="flex items-center justify-center gap-3 px-4 py-2">
          <label className="flex items-center gap-2 text-[11px] text-muted">
            Tamanho
            <input
              type="range"
              min={0.6}
              max={2.4}
              step={0.05}
              value={active.scale}
              onChange={(e) => {
                const scale = Number(e.target.value)
                setOverlays((list) => list.map((o) => (o.id === active.id ? { ...o, scale } : o)))
              }}
            />
          </label>
          <button
            type="button"
            onClick={() => {
              setOverlays((list) => list.filter((o) => o.id !== active.id))
              setSelected(null)
            }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-ember"
          >
            <Trash2 size={14} />
            Remover
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 border-t border-line">
        {(
          [
            ["ajustar", "Ajustar", SlidersHorizontal],
            ["texto", "Texto", Type],
            ["emoji", "Emoji", Smile],
          ] as const
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold ${
              tab === key ? "text-ember" : "text-muted"
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      <div className="min-h-[148px] border-t border-line px-4 py-3">
        {tab === "ajustar" && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAdjust((a) => ({ ...a, rotate: (a.rotate + 90) % 360 }))}
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-line py-2 text-xs font-semibold"
              >
                <RotateCw size={14} />
                Girar
              </button>
              <button
                type="button"
                onClick={() => setAdjust((a) => ({ ...a, flipX: !a.flipX }))}
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-line py-2 text-xs font-semibold"
              >
                <FlipHorizontal size={14} />
                Espelhar
              </button>
              <button
                type="button"
                onClick={() => setAdjust(INITIAL_ADJUST)}
                className="rounded-xl border border-line px-3 py-2 text-xs font-semibold text-muted"
              >
                Reset
              </button>
            </div>
            <Slider
              icon={<Sun size={14} />}
              label="Brilho"
              min={0.5}
              max={1.6}
              value={adjust.brightness}
              onChange={(brightness) => setAdjust((a) => ({ ...a, brightness }))}
            />
            <Slider
              icon={<Contrast size={14} />}
              label="Contraste"
              min={0.6}
              max={1.8}
              value={adjust.contrast}
              onChange={(contrast) => setAdjust((a) => ({ ...a, contrast }))}
            />
            <Slider
              label="Zoom"
              min={1}
              max={2.2}
              value={adjust.zoom}
              onChange={(zoom) => setAdjust((a) => ({ ...a, zoom }))}
            />
          </div>
        )}

        {tab === "texto" && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addText()
                  }
                }}
                maxLength={48}
                placeholder="Escreva em cima da foto"
                className="flex-1 rounded-full border border-line bg-card px-4 py-2 text-sm outline-none"
              />
              <button
                type="button"
                onClick={addText}
                className="rounded-full bg-ember px-3 py-2 text-xs font-bold text-on-accent"
              >
                Colocar
              </button>
            </div>
            <div className="flex items-center gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    setTextColor(color)
                    if (active?.kind === "text") {
                      setOverlays((list) =>
                        list.map((o) => (o.id === active.id ? { ...o, color } : o)),
                      )
                    }
                  }}
                  className={`h-7 w-7 rounded-full border ${
                    textColor === color ? "ring-2 ring-ember ring-offset-2 ring-offset-bg" : "border-line"
                  }`}
                  style={{ background: color }}
                  aria-label={`Cor ${color}`}
                />
              ))}
            </div>
            <p className="text-[11px] text-muted">Arraste o texto na foto para posicionar.</p>
          </div>
        )}

        {tab === "emoji" && (
          <div className="grid grid-cols-8 gap-1.5">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => addEmoji(emoji)}
                className="rounded-xl bg-card py-1.5 text-xl"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Slider({
  icon,
  label,
  min,
  max,
  value,
  onChange,
}: {
  icon?: ReactNode
  label: string
  min: number
  max: number
  value: number
  onChange: (value: number) => void
}) {
  return (
    <label className="flex items-center gap-3 text-xs text-muted">
      <span className="flex w-20 items-center gap-1 font-semibold">
        {icon}
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={0.02}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-[var(--ember)]"
      />
    </label>
  )
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("imagem"))
    img.src = src
  })
}

async function bakePhoto(src: string, adjust: Adjust, overlays: Overlay[]) {
  const img = await loadImage(src)
  const max = 1080
  const aspect = 4 / 5
  let outW = max
  let outH = Math.round(max / aspect)
  if (outH > max) {
    outH = max
    outW = Math.round(max * aspect)
  }
  const canvas = document.createElement("canvas")
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext("2d")
  if (!ctx) return src

  ctx.fillStyle = "#000"
  ctx.fillRect(0, 0, outW, outH)
  ctx.filter = `brightness(${adjust.brightness}) contrast(${adjust.contrast})`
  ctx.save()
  ctx.translate(outW / 2, outH / 2)
  ctx.rotate((adjust.rotate * Math.PI) / 180)
  if (adjust.flipX) ctx.scale(-1, 1)
  const viewW = adjust.rotate % 180 === 0 ? outW * adjust.zoom : outH * adjust.zoom
  const viewH = adjust.rotate % 180 === 0 ? outH * adjust.zoom : outW * adjust.zoom
  const cover = Math.max(viewW / img.width, viewH / img.height)
  const dw = img.width * cover
  const dh = img.height * cover
  ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh)
  ctx.restore()
  ctx.filter = "none"

  for (const item of overlays) {
    const x = (item.x / 100) * outW
    const y = (item.y / 100) * outH
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    if (item.kind === "emoji") {
      ctx.font = `${Math.round(56 * item.scale)}px sans-serif`
      ctx.fillText(item.value, x, y)
      continue
    }
    ctx.font = `800 ${Math.round(44 * item.scale)}px Syne, Manrope, sans-serif`
    ctx.lineWidth = Math.max(3, 6 * item.scale)
    ctx.strokeStyle = item.color === "#050805" ? "#ffffff" : "rgba(0,0,0,.7)"
    ctx.strokeText(item.value, x, y)
    ctx.fillStyle = item.color
    ctx.fillText(item.value, x, y)
  }

  return canvas.toDataURL("image/jpeg", 0.85)
}
