import { hashPassword, randomToken, verifyPassword } from "./password"
import type { Nivel } from "../types"

const KEY = "runclub.accounts.v2"

export type Account = {
  profileId: string | null
  email: string
  nome: string
  nivel: Nivel
  passwordHash: string
  salt: string
  emailConfirmed: boolean
  confirmToken: string | null
  confirmExpires: string | null
  resetToken: string | null
  resetExpires: string | null
  lgpdConsentAt: string
  failedLogins: number
  lockedUntil: string | null
  createdAt: string
}

export function loadAccounts(): Account[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    return JSON.parse(raw) as Account[]
  } catch {
    return []
  }
}

function saveAccounts(accounts: Account[]) {
  localStorage.setItem(KEY, JSON.stringify(accounts))
}

export function findAccount(email: string) {
  return loadAccounts().find((a) => a.email.toLowerCase() === email.trim().toLowerCase())
}

export async function createPendingAccount(input: {
  nome: string
  email: string
  password: string
  nivel: Nivel
}) {
  const email = input.email.trim().toLowerCase()
  if (findAccount(email)) return { error: "Esse e-mail já está cadastrado." as const }
  const { hash, salt } = await hashPassword(input.password)
  const confirmToken = randomToken()
  const account: Account = {
    profileId: null,
    email,
    nome: input.nome.trim(),
    nivel: input.nivel,
    passwordHash: hash,
    salt,
    emailConfirmed: false,
    confirmToken,
    confirmExpires: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    resetToken: null,
    resetExpires: null,
    lgpdConsentAt: new Date().toISOString(),
    failedLogins: 0,
    lockedUntil: null,
    createdAt: new Date().toISOString(),
  }
  saveAccounts([...loadAccounts(), account])
  return { error: null, confirmToken, email }
}

export async function verifyLogin(email: string, password: string) {
  const accounts = loadAccounts()
  const idx = accounts.findIndex((a) => a.email.toLowerCase() === email.trim().toLowerCase())
  if (idx < 0) {
    return {
      error:
        "Essa conta não existe neste aparelho. No celular é preciso criar a conta de novo — o cadastro do computador não passa sozinho." as const,
    }
  }
  const account = accounts[idx]
  if (account.lockedUntil && new Date(account.lockedUntil).getTime() > Date.now()) {
    return { error: "Conta temporariamente bloqueada. Tente de novo em alguns minutos." as const }
  }
  const ok = await verifyPassword(password, account.passwordHash, account.salt)
  if (!ok) {
    account.failedLogins += 1
    if (account.failedLogins >= 5) {
      account.lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString()
      account.failedLogins = 0
    }
    saveAccounts(accounts)
    return { error: "E-mail ou senha incorretos." as const }
  }
  if (!account.emailConfirmed) {
    return { error: "Confirme seu e-mail antes de entrar." as const, needsConfirm: true as const, email: account.email }
  }
  account.failedLogins = 0
  account.lockedUntil = null
  saveAccounts(accounts)
  return { error: null, account }
}

export function confirmAccount(token: string) {
  const accounts = loadAccounts()
  const account = accounts.find((a) => a.confirmToken === token)
  if (!account) return { error: "Link inválido ou já usado." as const }
  if (account.confirmExpires && new Date(account.confirmExpires).getTime() < Date.now()) {
    return { error: "Este link expirou. Faça o cadastro de novo." as const }
  }
  account.emailConfirmed = true
  account.confirmToken = null
  account.confirmExpires = null
  saveAccounts(accounts)
  return { error: null, account }
}

export function attachProfile(email: string, profileId: string) {
  const accounts = loadAccounts()
  const account = accounts.find((a) => a.email === email)
  if (!account) return
  account.profileId = profileId
  saveAccounts(accounts)
}

export function startPasswordReset(email: string) {
  const accounts = loadAccounts()
  const account = accounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase())
  if (!account) return { ok: true as const, token: null as string | null }
  const token = randomToken()
  account.resetToken = token
  account.resetExpires = new Date(Date.now() + 2 * 3600 * 1000).toISOString()
  saveAccounts(accounts)
  return { ok: true as const, token }
}

export async function completePasswordReset(token: string, password: string) {
  const accounts = loadAccounts()
  const account = accounts.find((a) => a.resetToken === token)
  if (!account) return { error: "Link inválido ou já usado." as const }
  if (account.resetExpires && new Date(account.resetExpires).getTime() < Date.now()) {
    return { error: "Este link expirou. Solicite outro." as const }
  }
  const { hash, salt } = await hashPassword(password)
  account.passwordHash = hash
  account.salt = salt
  account.resetToken = null
  account.resetExpires = null
  account.failedLogins = 0
  account.lockedUntil = null
  saveAccounts(accounts)
  return { error: null }
}

export function deleteAccountByEmail(email: string) {
  saveAccounts(loadAccounts().filter((a) => a.email !== email))
}
