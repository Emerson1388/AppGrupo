import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

export function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  autoComplete: string
  placeholder?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <label className="block text-xs font-semibold text-muted">
      {label}
      <span className="relative mt-1 block">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          required
          minLength={8}
          placeholder={placeholder}
          className="w-full rounded-xl border border-line bg-bg px-3 py-3 pr-11 text-sm text-ink outline-none focus:border-ember"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
          aria-label={show ? "Ocultar senha" : "Mostrar senha"}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </span>
    </label>
  )
}
