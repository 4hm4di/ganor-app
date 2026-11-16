// Haptic feedback for errors only (success stays silent).
// Android: the Vibration API. iPhone: Safari has no vibration API, so we toggle a hidden
// <input type="checkbox" switch>, which plays the system haptic tick on iOS 17.4 to 26.4
// (Apple closed this in iOS 26.5, and it only works soon after a tap). Elsewhere: nothing happens.
let last = 0
let iosSwitch: HTMLLabelElement | null = null

const isIOS = () => typeof navigator !== "undefined" && (/iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1))

function iosTick() {
  if (!iosSwitch) {
    const label = document.createElement("label")
    label.setAttribute("aria-hidden", "true")
    label.style.cssText = "position:fixed;left:-9999px;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none"
    const input = document.createElement("input")
    input.type = "checkbox"
    input.setAttribute("switch", "")
    input.tabIndex = -1
    label.appendChild(input)
    document.body.appendChild(label)
    iosSwitch = label
  }
  iosSwitch.click()
}

export function hapticError() {
  if (typeof window === "undefined") return
  const now = Date.now()
  if (now - last < 700) return // one buzz per error, even when a banner and an inline message appear together
  last = now
  try {
    if (typeof navigator.vibrate === "function" && !isIOS()) { navigator.vibrate([45, 55, 45]); return }
    if (isIOS()) { iosTick(); setTimeout(iosTick, 110); setTimeout(iosTick, 220) } // three quick ticks = error
  } catch { /* not allowed right now: stay silent */ }
}
