// Questions a host can add to a free event's RSVP. Name and phone are always asked.
export type RsvpField = { key: string; label: string; type: "text" | "email" | "select"; required: boolean; options?: string[] }

export const RSVP_PRESETS: Omit<RsvpField, "required">[] = [
  { key: "email", label: "Email", type: "email" },
  { key: "org", label: "Organisation or school", type: "text" },
  { key: "role", label: "Job title or role", type: "text" },
  { key: "gender", label: "Gender", type: "select", options: ["Female", "Male"] },
  { key: "age", label: "Age range", type: "select", options: ["Under 18", "18–24", "25–34", "35–44", "45 and over"] },
  { key: "heard", label: "How did you hear about this?", type: "select", options: ["WhatsApp", "Instagram", "X (Twitter)", "Facebook", "A friend", "Other"] },
  { key: "needs", label: "Dietary or access needs", type: "text" },
]
export const RSVP_MAX = 6

export function parseRsvpFields(raw: unknown): RsvpField[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((f): f is RsvpField => !!f && typeof f === "object" && typeof (f as RsvpField).key === "string" && typeof (f as RsvpField).label === "string")
    .slice(0, RSVP_MAX)
    .map((f) => ({
      key: f.key.replace(/[^a-z0-9_]/gi, "").slice(0, 24) || "q",
      label: String(f.label).slice(0, 80),
      type: f.type === "select" || f.type === "email" ? f.type : "text",
      required: Boolean(f.required),
      ...(f.type === "select" ? { options: (f.options ?? []).map((o) => String(o).slice(0, 40)).filter(Boolean).slice(0, 8) } : {}),
    }))
}
