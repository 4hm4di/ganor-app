import "server-only"
import { headers } from "next/headers"

export const PROVIDERS = [
  { id: "google", label: "Google", icon: "google" },
  { id: "azure", label: "Microsoft", icon: "microsoft" },
  { id: "apple", label: "Apple", icon: "apple" },
] as const
export type ProviderId = (typeof PROVIDERS)[number]["id"]

// Which sign-in providers are switched on in Supabase (Authentication > Providers).
// Buttons only show for providers that are enabled, so a half-set-up provider never shows a broken button.
export async function enabledProviders(): Promise<ProviderId[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! },
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    const s = (await res.json()) as { external?: Record<string, boolean> }
    return PROVIDERS.filter((p) => s.external?.[p.id]).map((p) => p.id)
  } catch {
    return []
  }
}

export async function siteOrigin() {
  const h = await headers()
  const proto = h.get("x-forwarded-proto") ?? "https"
  const host = h.get("x-forwarded-host") ?? h.get("host")
  return process.env.NEXT_PUBLIC_SITE_URL && !host ? process.env.NEXT_PUBLIC_SITE_URL : `${proto}://${host}`
}

export function safeNext(next: unknown, fallback = "/dashboard") {
  const n = typeof next === "string" ? next : ""
  return n.startsWith("/") && !n.startsWith("//") ? n : fallback
}

export const PASSWORD_MIN = 8
