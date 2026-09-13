import { afterEach, beforeEach, describe, expect, it } from "vitest"
import {
  attachProfile,
  completePasswordReset,
  confirmAccount,
  createPendingAccount,
  deleteAccountByEmail,
  findAccount,
  startPasswordReset,
  verifyLogin,
} from "./accounts"

const atleta = {
  nome: "Ana Silva",
  email: "ana@plasts.run",
  password: "corrida12",
  nivel: "iniciante" as const,
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  localStorage.clear()
})

describe("createPendingAccount", () => {
  it("cria conta pendente com e-mail em minúsculas", async () => {
    const created = await createPendingAccount({ ...atleta, email: "Ana@Plasts.Run" })
    expect(created.error).toBeNull()
    expect(created.email).toBe("ana@plasts.run")
    expect(created.confirmToken).toMatch(/^[0-9a-f]{64}$/)
    expect(findAccount("ANA@plasts.run")?.emailConfirmed).toBe(false)
  })

  it("recusa e-mail já cadastrado", async () => {
    await createPendingAccount(atleta)
    const again = await createPendingAccount(atleta)
    expect(again.error).toBe("Esse e-mail já está cadastrado.")
  })
})

describe("confirmAccount / verifyLogin", () => {
  it("não deixa entrar antes de confirmar o e-mail", async () => {
    await createPendingAccount(atleta)
    const pending = await verifyLogin(atleta.email, atleta.password)
    expect(pending.error).toBe("Confirme seu e-mail antes de entrar.")
  })

  it("entra depois da confirmação com a senha certa", async () => {
    const created = await createPendingAccount(atleta)
    const confirmed = confirmAccount(created.confirmToken!)
    expect(confirmed.error).toBeNull()
    attachProfile(atleta.email, "u1")
    const ok = await verifyLogin(atleta.email, atleta.password)
    expect(ok.error).toBeNull()
    expect("account" in ok && ok.account?.profileId).toBe("u1")
  })

  it("reprova senha errada e e-mail inexistente", async () => {
    const created = await createPendingAccount(atleta)
    confirmAccount(created.confirmToken!)
    const wrong = await verifyLogin(atleta.email, "senhaErrada1")
    expect(wrong.error).toBe("E-mail ou senha incorretos.")
    const missing = await verifyLogin("naoexiste@plasts.run", atleta.password)
    expect(missing.error).toMatch(/não existe neste aparelho/i)
  })

  it("rejeita token de confirmação inválido ou expirado", () => {
    expect(confirmAccount("token-falso").error).toBe("Link inválido ou já usado.")
  })
})

describe("reset e exclusão", () => {
  it("troca a senha com token válido", async () => {
    const created = await createPendingAccount(atleta)
    confirmAccount(created.confirmToken!)
    const reset = startPasswordReset(atleta.email)
    expect(reset.token).toBeTruthy()
    const done = await completePasswordReset(reset.token!, "novaSenha9")
    expect(done.error).toBeNull()
    const old = await verifyLogin(atleta.email, atleta.password)
    expect(old.error).toBe("E-mail ou senha incorretos.")
    const next = await verifyLogin(atleta.email, "novaSenha9")
    expect(next.error).toBeNull()
  })

  it("não revela se o e-mail existe no pedido de reset", () => {
    const ghost = startPasswordReset("ninguem@plasts.run")
    expect(ghost.ok).toBe(true)
    expect(ghost.token).toBeNull()
  })

  it("apaga a conta pelo e-mail", async () => {
    await createPendingAccount(atleta)
    deleteAccountByEmail(atleta.email)
    expect(findAccount(atleta.email)).toBeUndefined()
  })
})
