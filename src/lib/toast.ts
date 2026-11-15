// Client-side banner: shows the same pop-up as server-action flashes (see Toaster).
export function toast(message: string, kind: "ok" | "error" = "ok") {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("ganor:toast", { detail: { k: kind, m: message } }))
}
