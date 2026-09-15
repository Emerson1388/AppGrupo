import { describe, expect, it } from "vitest"
import { invitePath, rememberInviteSlug } from "./inviteSlug"

describe("inviteSlug", () => {
  it("guarda o slug do convite e monta o caminho", () => {
    rememberInviteSlug("Grupo-A")
    expect(invitePath()).toBe("/g/grupo-a")
  })
})
