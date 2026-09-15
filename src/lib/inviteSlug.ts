const KEY = "runclub.inviteSlug"

export function rememberInviteSlug(slug: string) {
  const clean = slug.trim().toLowerCase()
  if (!clean) return
  try {
    sessionStorage.setItem(KEY, clean)
  } catch {
    /* sessão privada / quota */
  }
}

export function readInviteSlug() {
  try {
    return sessionStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function invitePath(fallback = "plasts-run") {
  return `/g/${readInviteSlug() || fallback}`
}
