import { createClient } from "@supabase/supabase-js"

/** Chave publishable do Plast's Run — pública de propósito (RLS protege os dados). */
const PUBLIC_URL = "https://nrzgxnacvljenqlmbglv.supabase.co"
const PUBLIC_ANON = "sb_publishable_rzc4j_zLVEjhntzdehyTZg_l11sWCwD"

function inUnitTest() {
  return import.meta.env.MODE === "test"
}

/** Auth e REST usam a origem do projeto, nunca /rest/v1 nem /auth/v1. */
export function normalizeSupabaseUrl(raw: string) {
  return raw
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/rest\/v1$/i, "")
    .replace(/\/auth\/v1$/i, "")
}

const fromEnvUrl = normalizeSupabaseUrl(String(import.meta.env.VITE_SUPABASE_URL ?? ""))
const fromEnvAnon = String(import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim()

const url = fromEnvUrl || (inUnitTest() ? "" : PUBLIC_URL)
const anon = fromEnvAnon || (inUnitTest() ? "" : PUBLIC_ANON)

export const supabaseEnabled = Boolean(url && anon)

export function supabaseAuthInfo() {
  let host = ""
  try {
    host = url ? new URL(url).host : ""
  } catch {
    host = "invalid-url"
  }
  const keyKind = anon.startsWith("sb_publishable_")
    ? "publishable"
    : anon.startsWith("eyJ")
      ? "jwt-anon"
      : anon
        ? "other"
        : "missing"
  return {
    enabled: supabaseEnabled,
    host,
    keyKind,
    keyChars: anon.length,
  }
}

/** Contas em localStorage só no Vite de desenvolvimento, nunca no build de produção. */
export function localAuthAllowed() {
  return !supabaseEnabled && import.meta.env.DEV
}

export const supabase = supabaseEnabled
  ? createClient(url, anon, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
        storageKey: "appgrupo-auth",
      },
    })
  : null
