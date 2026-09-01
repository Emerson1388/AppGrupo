function toHex(bytes: Uint8Array) {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("")
}

function fromHex(hex: string) {
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return out
}

async function pbkdf2(password: string, salt: Uint8Array) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  )
  const saltCopy = new Uint8Array(salt.byteLength)
  saltCopy.set(salt)
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: saltCopy,
      iterations: 210_000,
    },
    key,
    256,
  )
  return toHex(new Uint8Array(bits))
}

export function passwordIssues(password: string) {
  const issues: string[] = []
  if (password.length < 8) issues.push("mínimo de 8 caracteres")
  if (!/[A-Za-z]/.test(password)) issues.push("pelo menos uma letra")
  if (!/\d/.test(password)) issues.push("pelo menos um número")
  return issues
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const hash = await pbkdf2(password, salt)
  return { hash, salt: toHex(salt) }
}

export async function verifyPassword(password: string, hash: string, salt: string) {
  const next = await pbkdf2(password, fromHex(salt))
  if (next.length !== hash.length) return false
  let diff = 0
  for (let i = 0; i < next.length; i++) diff |= next.charCodeAt(i) ^ hash.charCodeAt(i)
  return diff === 0
}

export function randomToken() {
  return toHex(crypto.getRandomValues(new Uint8Array(32)))
}
