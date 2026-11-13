"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import jsQR from "jsqr"
import { checkIn } from "../actions"
import type { CheckInResult } from "@/lib/gate"
import { Loader } from "@/components/Loader"
import { Icon } from "@/components/Icon"
import { formatTime } from "@/lib/ganor"

type View = "ready" | "checking" | "ok" | "warn" | "bad"

const RESULT: Record<CheckInResult["result"], { view: View; icon: string; title: string }> = {
  ok: { view: "ok", icon: "/img/gate/ganor-status-admitted.svg", title: "Admitted" },
  already: { view: "warn", icon: "/img/gate/ganor-status-already-checked-in.svg", title: "Already checked in" },
  not_found: { view: "bad", icon: "/img/gate/ganor-status-not-valid.svg", title: "Not a valid ticket" },
  wrong_event: { view: "bad", icon: "/img/gate/ganor-status-not-valid.svg", title: "Ticket for another event" },
  not_valid: { view: "bad", icon: "/img/gate/ganor-status-not-valid.svg", title: "Refunded or cancelled" },
  not_allowed: { view: "bad", icon: "/img/gate/ganor-status-not-valid.svg", title: "Not assigned to this event" },
  signed_out: { view: "bad", icon: "/img/gate/ganor-status-not-valid.svg", title: "Signed out" },
}

type BarcodeDetectorLike = { detect: (src: CanvasImageSource) => Promise<{ rawValue: string }[]> }

// Camera QR scanner with typed-code fallback. Uses the browser's BarcodeDetector where it exists
// (Chrome on Android) and jsQR elsewhere (iPhone Safari).
export function Scanner({ eventId, initialIn, total, scannerName }: { eventId: string; initialIn: number; total: number; scannerName: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const busy = useRef(false)
  const last = useRef<{ code: string; at: number }>({ code: "", at: 0 })
  const [view, setView] = useState<View>("ready")
  const [res, setRes] = useState<CheckInResult | null>(null)
  const [counts, setCounts] = useState({ in: initialIn, total })
  const [camera, setCamera] = useState<"off" | "on" | "denied" | "none">("off")
  const [code, setCode] = useState("")

  const submit = useCallback(async (raw: string) => {
    const value = raw.trim()
    if (!value || busy.current) return
    const now = Date.now()
    if (value === last.current.code && now - last.current.at < 4000) return
    last.current = { code: value, at: now }
    busy.current = true
    setView("checking")
    const r = await checkIn(eventId, value)
    setRes(r)
    if (typeof r.checked_in === "number" && typeof r.total === "number") setCounts({ in: r.checked_in, total: r.total })
    setView(RESULT[r.result].view)
    navigator.vibrate?.(r.result === "ok" ? 80 : [60, 60, 60])
    // Signed out (e.g. this gate account signed in on another phone): show why, then go to sign-in.
    if (r.result === "signed_out") { setTimeout(() => window.location.assign("/gate"), 3500); return }
    setTimeout(() => {
      setView("ready")
      busy.current = false
    }, r.result === "ok" ? 1600 : 2600)
  }, [eventId])

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) return setCamera("none")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false })
      const video = videoRef.current!
      video.srcObject = stream
      await video.play()
      setCamera("on")
    } catch {
      setCamera("denied")
    }
  }, [])

  // Decode frames while the camera is on.
  useEffect(() => {
    if (camera !== "on") return
    const video = videoRef.current!
    const W = window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => BarcodeDetectorLike }
    const detector = W.BarcodeDetector ? new W.BarcodeDetector({ formats: ["qr_code"] }) : null
    canvasRef.current ??= document.createElement("canvas")
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!
    let raf = 0
    let stop = false
    const tick = async () => {
      if (stop) return
      if (!busy.current && video.readyState >= 2) {
        try {
          if (detector) {
            const found = await detector.detect(video)
            if (found[0]?.rawValue) submit(found[0].rawValue)
          } else {
            const w = 480
            const h = Math.round((video.videoHeight / video.videoWidth) * w) || 360
            canvas.width = w
            canvas.height = h
            ctx.drawImage(video, 0, 0, w, h)
            const img = ctx.getImageData(0, 0, w, h)
            const qr = jsQR(img.data, w, h, { inversionAttempts: "dontInvert" })
            if (qr?.data) submit(qr.data)
          }
        } catch { /* keep scanning */ }
      }
      raf = window.setTimeout(() => requestAnimationFrame(tick), 180) as unknown as number
    }
    tick()
    return () => {
      stop = true
      clearTimeout(raf)
    }
  }, [camera, submit])

  // Release the camera when leaving the page.
  useEffect(() => {
    const video = videoRef.current
    return () => {
      const s = video?.srcObject as MediaStream | null
      s?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const info = res ? RESULT[res.result] : null
  const pct = counts.total ? counts.in / counts.total : 0

  return (
    <div className="scanner">
      <div className="card scanner__stats">
        <p className="card__big" style={{ fontVariantNumeric: "tabular-nums" }}><span>{counts.in}</span><small> of {counts.total} in</small></p>
        <div className="meter"><i style={{ "--p": pct } as React.CSSProperties} /></div>
        <p className="small muted">Scanning as {scannerName}</p>
      </div>

      <div className={`gate scanner__gate${view !== "ready" && view !== "checking" ? " is-shown" : ""}`} data-state={view} aria-live="assertive">
        <video ref={videoRef} className={`scanner__video${camera === "on" ? " is-on" : ""}`} playsInline muted />
        <div className="gate__ready">
          <div className="gate__finder"><i /><i /><i /><i />{camera !== "on" && <Icon name="qr-code" className="gate__qr" />}<span className="gate__line" /></div>
          {camera === "on" ? (
            <p>Point the camera at the QR code</p>
          ) : (
            <button type="button" className="btn btn--primary btn--sm" onClick={startCamera}>
              <span>{camera === "denied" ? "Allow camera and try again" : "Start camera"}</span>
              <span className="btn__arrow" aria-hidden="true"><Icon name="qr-code" /></span>
            </button>
          )}
          {camera === "denied" && <p>Camera blocked. Allow it in your browser settings, or type the code below.</p>}
          {camera === "none" && <p>This browser can&rsquo;t use the camera. Type the code below.</p>}
        </div>
        <div className="gate__checking"><Loader size={72} /><span>Checking…</span></div>
        <div className="gate__result">
          {info && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={info.icon} alt="" width={64} height={64} />
              <p className="gate__title">{info.title}</p>
              <p className="gate__sub">
                {res?.guest ? `${res.guest}${res.ticket_type ? ` · ${res.ticket_type}` : ""}` : ""}
                {res?.result === "already" && res.at ? ` · in at ${formatTime(res.at)}` : ""}
                {res?.result === "signed_out" ? (res.reason === "replaced" ? "This gate account signed in on another phone. Sign in again here to keep scanning." : "Sign in again to keep scanning.") : ""}
              </p>
            </>
          )}
        </div>
      </div>

      <form
        className="card scanner__manual"
        onSubmit={(e) => {
          e.preventDefault()
          submit(code)
          setCode("")
        }}
      >
        <label className="field">
          <span className="field__label">Or type the ticket code</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            placeholder="GNR-ABCDE-FGH23…"
            style={{ letterSpacing: ".06em", fontVariantNumeric: "tabular-nums" }}
          />
        </label>
        <button type="submit" className="btn btn--primary btn--sm btn--plain" disabled={!code.trim() || view === "checking"}>Check in</button>
      </form>
    </div>
  )
}
