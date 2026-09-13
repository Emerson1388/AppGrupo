import { describe, expect, it } from "vitest"
import {
  checkinAberto,
  formatDia,
  formatDiaLongo,
  formatHora,
  formatQuando,
  kmLabel,
  nivelLabel,
  treinoPassou,
  uid,
} from "./format"
import { makeTreino } from "../test/helpers"

describe("formatDia / formatHora / formatQuando", () => {
  it("formata o dia em português", () => {
    expect(formatDia("2026-09-12")).toMatch(/s[áa]b.*12.*set/i)
  })

  it("formata o dia longo", () => {
    expect(formatDiaLongo("2026-09-12")).toMatch(/sábado.*12.*setembro/i)
  })

  it("corta horário para HH:mm", () => {
    expect(formatHora("07:30:00")).toBe("07:30")
    expect(formatHora("19:00")).toBe("19:00")
  })

  it("formata data e hora juntas", () => {
    expect(formatQuando("2026-09-12T07:15:00")).toMatch(/12.*set.*07:15/i)
  })
})

describe("kmLabel / nivelLabel / uid", () => {
  it("mostra km inteiro sem decimal", () => {
    expect(kmLabel(10)).toBe("10 km")
  })

  it("mostra km quebrado com uma casa", () => {
    expect(kmLabel(5.5)).toBe("5.5 km")
  })

  it("traduz o nível do atleta", () => {
    expect(nivelLabel("iniciante")).toBe("Iniciante")
    expect(nivelLabel("intermediario")).toBe("Intermediário")
    expect(nivelLabel("avancado")).toBe("Avançado")
  })

  it("gera id com o prefixo pedido", () => {
    expect(uid("treino")).toMatch(/^treino_[a-z0-9]+$/)
  })
})

describe("checkinAberto / treinoPassou", () => {
  it("abre check-in no mesmo dia do treino", () => {
    const t = makeTreino({ data: "2026-09-12", horario: "19:00" })
    expect(checkinAberto(t, new Date("2026-09-12T10:00:00"))).toBe(true)
  })

  it("abre check-in 45 min antes e fecha 3 h depois quando o dia já mudou", () => {
    const t = makeTreino({ data: "2026-09-12", horario: "00:30" })
    expect(checkinAberto(t, new Date("2026-09-11T23:50:00"))).toBe(true)
    expect(checkinAberto(t, new Date("2026-09-11T23:40:00"))).toBe(false)
    const tarde = makeTreino({ data: "2026-09-11", horario: "23:00" })
    expect(checkinAberto(tarde, new Date("2026-09-12T01:50:00"))).toBe(true)
    expect(checkinAberto(tarde, new Date("2026-09-12T02:10:00"))).toBe(false)
  })

  it("marca treino como encerrado depois do horário", () => {
    const t = makeTreino({ data: "2026-09-12", horario: "07:00" })
    expect(treinoPassou(t, new Date("2026-09-12T07:01:00"))).toBe(true)
    expect(treinoPassou(t, new Date("2026-09-12T06:59:00"))).toBe(false)
  })
})
