import type { User } from "@supabase/supabase-js"

export function emailDomain(email: string) {
  const at = email.lastIndexOf("@")
  return at >= 0 ? email.slice(at + 1).toLowerCase() : ""
}

export function logAuthEvent(event: string, detail: Record<string, unknown>) {
  console.info(`[AUTH] ${event}`, detail)
}

export function isDuplicateSignupUser(user: User | null | undefined) {
  if (!user) return false
  return Array.isArray(user.identities) && user.identities.length === 0
}

export function isAlreadyRegisteredError(message: string, code = "") {
  const m = `${code} ${message}`.toLowerCase()
  return (
    m.includes("already registered")
    || m.includes("already been registered")
    || m.includes("user_already_exists")
  )
}

export function isDatabaseSignupError(message: string, code = "") {
  const m = `${code} ${message}`.toLowerCase()
  return (
    m.includes("database error")
    || m.includes("error saving user")
    || m.includes("error creating user")
  )
}
