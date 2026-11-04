import { createClient } from "@supabase/supabase-js"

/** Chave publishable do Plast's Run — pública de propósito (RLS protege os dados). */
const PUBLIC_URL = "https://nrzgxnacvljenqlmbglv.supabase.co"
const PUBLIC_ANON = "sb_publishable_rzc4j_zLVEjhntzdehyTZg_l11sWCwD"

function inUnitTest() {
  return import.meta.env.MODE === "test"
}

const fromEnvUrl = String(import.meta.env.VITE_SUPABASE_URL ?? "").trim()
const fromEnvAnon = String(import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim()

const url = fromEnvUrl || (inUnitTest() ? "" : PUBLIC_URL)
const anon = fromEnvAnon || (inUnitTest() ? "" : PUBLIC_ANON)

export const supabaseEnabled = Boolean(url && anon)

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
