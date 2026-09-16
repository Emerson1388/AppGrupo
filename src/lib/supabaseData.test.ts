import { describe, expect, it } from "vitest"
import {
  authErrorMessage,
  cloudErrorMessage,
  DEFAULT_AVATAR,
  embeddedFotoError,
  logSyncError,
  mapProfile,
  officialFotoUrl,
  saveProfilePatch,
} from "./supabaseData"
import { localAuthAllowed } from "./supabase"

describe("authErrorMessage", () => {
  it("traduz e-mail não confirmado", () => {
    expect(authErrorMessage("Email not confirmed")).toMatch(/e-mail de confirmação/i)
  })

  it("traduz login inválido", () => {
    expect(authErrorMessage("Invalid login credentials")).toMatch(/não conferem/i)
  })

  it("traduz e-mail já cadastrado", () => {
    expect(authErrorMessage("User already registered")).toBe("Esse e-mail já está cadastrado.")
  })

  it("traduz senha fraca do provedor", () => {
    expect(authErrorMessage("Password should be at least 8 characters")).toMatch(/8 caracteres/)
  })

  it("esconde erros técnicos do provedor", () => {
    expect(authErrorMessage("PGRST116 unexpected")).toMatch(/sessão expirada|tente de novo/i)
  })
})

describe("cloudErrorMessage", () => {
  it("traduz check-in fora da janela", () => {
    expect(cloudErrorMessage("Check-in fora da janela")).toMatch(/45 min/)
  })

  it("traduz presença duplicada", () => {
    expect(cloudErrorMessage("duplicate key value")).toMatch(/já registrada/i)
  })
})

const profileRow = (foto_url: string | null) => ({
  id: "11111111-1111-4111-8111-111111111111",
  grupo_id: "22222222-2222-4222-8222-222222222222",
  nome: "Ana",
  email: "ana@grupo.test",
  foto_url,
  data_nascimento: null,
  distancia_preferida: null,
  pace_medio: null,
  nivel: "iniciante",
  meta: null,
  bio: null,
  role: "atleta",
})

describe("foto de perfil (fonte única)", () => {
  const storageUrl =
    "https://xyz.supabase.co/storage/v1/object/public/midia/11111111-1111-4111-8111-111111111111/avatars/profile.jpg?v=9"

  it("carrega a URL do Storage e ignora data URL, blob e pravatar", () => {
    expect(officialFotoUrl(storageUrl)).toBe(storageUrl)
    expect(officialFotoUrl("data:image/jpeg;base64,aaaa")).toBe(DEFAULT_AVATAR)
    expect(officialFotoUrl("blob:http://localhost/abc")).toBe(DEFAULT_AVATAR)
    expect(officialFotoUrl("https://i.pravatar.cc/200?u=ana%40grupo.test")).toBe(DEFAULT_AVATAR)
    expect(officialFotoUrl(null)).toBe(DEFAULT_AVATAR)
    expect(officialFotoUrl("")).toBe(DEFAULT_AVATAR)
  })

  it("mapProfile usa profiles.foto_url, não inventa foto por e-mail", () => {
    expect(mapProfile(profileRow(storageUrl), "ana@grupo.test").fotoUrl).toBe(storageUrl)
    expect(mapProfile(profileRow("data:image/png;base64,xxxx"), "ana@grupo.test").fotoUrl).toBe(
      DEFAULT_AVATAR,
    )
    expect(mapProfile(profileRow(null), "outro@dispositivo.test").fotoUrl).toBe(DEFAULT_AVATAR)
  })

  it("recusa persistir foto embutida no perfil", async () => {
    expect(embeddedFotoError("data:image/jpeg;base64,aaaa")).toMatch(/armazenamento/i)
    const result = await saveProfilePatch("11111111-1111-4111-8111-111111111111", {
      fotoUrl: "data:image/jpeg;base64,aaaa",
    })
    expect(result.error).toMatch(/armazenamento/i)
  })

  it("fluxo conceitual: login → foto visível → alterar → persistir URL, não data URL", () => {
    const before = mapProfile(profileRow(null), "ana@grupo.test")
    expect(before.fotoUrl).toBe(DEFAULT_AVATAR)
    const afterUpload = mapProfile(profileRow(storageUrl), "ana@grupo.test")
    expect(afterUpload.fotoUrl).toBe(storageUrl)
    expect(afterUpload.fotoUrl.startsWith("data:")).toBe(false)
    const afterReload = mapProfile(profileRow(storageUrl), "ana@grupo.test")
    expect(afterReload.fotoUrl).toBe(afterUpload.fotoUrl)
  })
})

describe("fonte de verdade na nuvem", () => {
  it("testes unitários não usam auth local misturada com Supabase", () => {
    expect(localAuthAllowed()).toBe(true)
  })

  it("erros de sync não viram silêncio", () => {
    expect(logSyncError("profiles", "select", "permission denied")).toContain("[SYNC ERROR]")
    expect(logSyncError("profiles", "select", "permission denied")).toContain("tabela: profiles")
    expect(logSyncError("profiles", "select", "permission denied")).toContain("operação: select")
    expect(logSyncError("profiles", "select", "permission denied")).toContain("permission denied")
  })
})
