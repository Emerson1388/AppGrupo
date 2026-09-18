import { createClient } from "@supabase/supabase-js"

const url = String(import.meta.env.VITE_SUPABASE_URL ?? "").trim()
const anon = String(import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim()

export const supabaseEnabled = Boolean(url && anon)

export const CLOUD_SETUP_ERROR =
  "Este endereço está sem a nuvem do grupo. No celular abra o mesmo link de produção do computador (não o IP local) e publique de novo com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY."

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
      },
    })
  : null
