import "server-only"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib"
import fontkit from "@pdf-lib/fontkit"
import { LOCKUP_H, LOCKUP_SYMBOL, LOCKUP_WORDMARK } from "./pdf-brand"

export type Guest = { name: string; ticketType: string; code: string; checkedInAt: string | null; order: string; phone?: string; email?: string | null; answers?: Record<string, string> }
export type GuestListInput = {
  event: { title: string; date: string; time: string; venue: string; city: string }
  host: string
  guests: Guest[]
  generatedAt: string
  formatTime: (iso: string) => string
}

const INDIGO = rgb(0x37 / 255, 0x30 / 255, 0xb8 / 255)
const INK = rgb(0x15 / 255, 0x13 / 255, 0x2a / 255)
const MUTED = rgb(0x5b / 255, 0x58 / 255, 0x70 / 255)
const SAND = rgb(0xf6 / 255, 0xf1 / 255, 0xe7 / 255)
const LINE = rgb(0xe3 / 255, 0xdd / 255, 0xd0 / 255)
const MARIGOLD = rgb(0xff / 255, 0xb2 / 255, 0x1e / 255)
const GREEN = rgb(0x1c / 255, 0x7a / 255, 0x45 / 255)
const WHITE = rgb(1, 1, 1)

const A4 = { w: 595.28, h: 841.89 }
const M = 40 // page margin

const fontDir = path.join(process.cwd(), "src/lib/pdf-fonts")

// Draw the Ganor lockup with its top-left corner at (x, top), `height` points tall.
function lockup(page: PDFPage, x: number, top: number, height: number, color = INDIGO) {
  const s = height / LOCKUP_H
  page.drawSvgPath(LOCKUP_SYMBOL, { x, y: top - 13.2 * s, scale: 5.5 * s, color })
  page.drawSvgPath(LOCKUP_WORDMARK, { x: x + 825 * s, y: top - LOCKUP_H * s, scale: s, color })
}

function fit(text: string, font: PDFFont, size: number, max: number) {
  if (font.widthOfTextAtSize(text, size) <= max) return text
  let t = text
  while (t.length > 1 && font.widthOfTextAtSize(`${t}…`, size) > max) t = t.slice(0, -1)
  return `${t.trimEnd()}…`
}

// A4 guest list in Ganor branding: indigo header with the logo, event summary, a striped
// table that continues across pages, and a footer with page numbers.
export async function buildGuestPdf(input: GuestListInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)
  const [reg, semi, display] = await Promise.all([
    readFile(path.join(fontDir, "Inter-Regular.ttf")),
    readFile(path.join(fontDir, "Inter-SemiBold.ttf")),
    readFile(path.join(fontDir, "Bricolage-ExtraBold.ttf")),
  ])
  const fReg = await doc.embedFont(reg, { subset: true })
  const fSemi = await doc.embedFont(semi, { subset: true })
  const fDisp = await doc.embedFont(display, { subset: true })
  doc.setTitle(`Guest list · ${input.event.title}`)
  doc.setAuthor("Ganor")
  doc.setCreator("Ganor · ganor.ng")
  doc.setProducer("Ganor")

  const total = input.guests.length
  const inCount = input.guests.filter((g) => g.checkedInAt).length
  const byType = new Map<string, number>()
  input.guests.forEach((g) => byType.set(g.ticketType, (byType.get(g.ticketType) ?? 0) + 1))

  const cols = [
    { key: "#", w: 28 },
    { key: "Guest", w: 158 },
    { key: "Ticket", w: 100 },
    { key: "Code", w: 118 },
    { key: "Checked in", w: A4.w - 2 * M - 28 - 158 - 100 - 118 },
  ]
  const rowH = 24

  const pages: PDFPage[] = []
  const newPage = (first: boolean) => {
    const page = doc.addPage([A4.w, A4.h])
    pages.push(page)
    let y = A4.h
    if (first) {
      // Header band
      page.drawRectangle({ x: 0, y: A4.h - 96, width: A4.w, height: 96, color: INDIGO })
      lockup(page, M, A4.h - 34, 28, WHITE)
      const label = "GUEST LIST"
      page.drawText(label, { x: A4.w - M - fSemi.widthOfTextAtSize(label, 9) - 0, y: A4.h - 52, size: 9, font: fSemi, color: MARIGOLD, characterSpacing: 1.2 } as never)
      y = A4.h - 96 - 34
      page.drawText(fit(input.event.title, fDisp, 24, A4.w - 2 * M), { x: M, y, size: 24, font: fDisp, color: INK })
      y -= 20
      const meta = `${input.event.date} · ${input.event.time} · ${input.event.venue}, ${input.event.city} · Hosted by ${input.host}`
      page.drawText(fit(meta, fReg, 10, A4.w - 2 * M), { x: M, y, size: 10, font: fReg, color: MUTED })
      y -= 28
      // Summary tiles
      const tiles = [
        { k: "Guests", v: String(total) },
        { k: "Checked in", v: `${inCount} of ${total}` },
        { k: "Ticket types", v: [...byType.entries()].map(([t, n]) => `${t} ${n}`).join(" · ") || "-" },
      ]
      const tw = (A4.w - 2 * M - 16) / 3
      tiles.forEach((t, i) => {
        const x = M + i * (tw + 8)
        page.drawRectangle({ x, y: y - 46, width: tw, height: 50, color: SAND })
        page.drawText(t.k.toUpperCase(), { x: x + 12, y: y - 12, size: 7.5, font: fSemi, color: MUTED })
        page.drawText(fit(t.v, i === 2 ? fSemi : fDisp, i === 2 ? 9.5 : 16, tw - 24), { x: x + 12, y: y - 34, size: i === 2 ? 9.5 : 16, font: i === 2 ? fSemi : fDisp, color: INK })
      })
      y -= 70
    } else {
      lockup(page, M, A4.h - 30, 16, INDIGO)
      page.drawText(fit(input.event.title, fSemi, 9, 300), { x: A4.w - M - Math.min(300, fSemi.widthOfTextAtSize(input.event.title, 9)), y: A4.h - 42, size: 9, font: fSemi, color: MUTED })
      y = A4.h - 64
    }
    // Table head
    page.drawRectangle({ x: M, y: y - rowH + 6, width: A4.w - 2 * M, height: rowH, color: INK })
    let x = M + 8
    cols.forEach((c) => {
      page.drawText(c.key.toUpperCase(), { x, y: y - 10, size: 7.5, font: fSemi, color: WHITE })
      x += c.w
    })
    return { page, y: y - rowH - 2 }
  }

  let { page, y } = newPage(true)
  if (total === 0) {
    page.drawText("No guests yet. Guests appear here once they buy or claim tickets.", { x: M, y: y - 14, size: 10, font: fReg, color: MUTED })
  }
  input.guests.forEach((g, i) => {
    if (y < M + 40) ({ page, y } = newPage(false))
    if (i % 2 === 0) page.drawRectangle({ x: M, y: y - rowH + 8, width: A4.w - 2 * M, height: rowH, color: SAND })
    let x = M + 8
    const ty = y - 8
    const cells = [String(i + 1), g.name, g.ticketType, g.code, g.checkedInAt ? input.formatTime(g.checkedInAt) : "Not yet"]
    cells.forEach((text, ci) => {
      const font = ci === 1 ? fSemi : ci === 3 ? fSemi : fReg
      const color = ci === 4 ? (g.checkedInAt ? GREEN : MUTED) : ci === 0 ? MUTED : INK
      page.drawText(fit(text, font, 9.5, cols[ci]!.w - 10), { x, y: ty, size: 9.5, font, color, characterSpacing: ci === 3 ? 0.6 : 0 } as never)
      x += cols[ci]!.w
    })
    y -= rowH
  })

  // Footers on every page
  pages.forEach((p, i) => {
    p.drawLine({ start: { x: M, y: 34 }, end: { x: A4.w - M, y: 34 }, thickness: 0.6, color: LINE })
    p.drawText(`Ganor · ganor.ng · Generated ${input.generatedAt} · For event entry only. Keep this list private.`, { x: M, y: 20, size: 7.5, font: fReg, color: MUTED })
    const pn = `Page ${i + 1} of ${pages.length}`
    p.drawText(pn, { x: A4.w - M - fReg.widthOfTextAtSize(pn, 7.5), y: 20, size: 7.5, font: fReg, color: MUTED })
  })
  return doc.save()
}

// RSVP answers become extra columns, one per question the host asked.
export function guestCsv(guests: Guest[], formatTime: (iso: string) => string, questions: { key: string; label: string }[] = []) {
  // Cells that start with = + - @ are prefixed so spreadsheet apps don't run them as formulas.
  const esc = (raw: string) => { const v = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw; return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v }
  const qs = questions.filter((q) => q.key !== "email")
  const rows = [
    ["#", "Guest", "Phone", "Email", "Ticket type", "Ticket code", "Order", "Checked in", ...qs.map((q) => q.label)],
    ...guests.map((g, i) => [String(i + 1), g.name, g.phone ?? "", g.email ?? "", g.ticketType, g.code, g.order, g.checkedInAt ? formatTime(g.checkedInAt) : "", ...qs.map((q) => g.answers?.[q.key] ?? "")]),
  ]
  return "﻿" + rows.map((r) => r.map(esc).join(",")).join("\r\n")
}
