// Haptic feedback for errors only (success stays silent). Uses the Vibration API: Android browsers
// and the installed app vibrate; iPhone Safari doesn't support it and simply ignores the call.
let last = 0

export function hapticError() {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return
  const now = Date.now()
  if (now - last < 700) return // one buzz per error, even when a banner and an inline message appear together
  last = now
  try { navigator.vibrate([45, 55, 45]) } catch { /* not allowed before the user has interacted */ }
}
