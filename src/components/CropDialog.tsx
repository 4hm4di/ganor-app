"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

// Crop before upload: drag to position, slider (or pinch / wheel) to zoom, then confirm.
// Output is drawn to a canvas at the final size, so the uploaded file is exactly what was previewed.
export function CropDialog({ file, aspect, outWidth, round, onCancel, onConfirm }: {
  file: File; aspect: number; outWidth: number; round?: boolean
  onCancel: () => void; onConfirm: (blob: Blob) => void
}) {
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [src, setSrc] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 }) // offset of the image centre from the frame centre, in frame px
  const [frameW, setFrameW] = useState(0)
  const [working, setWorking] = useState(false)
  const frame = useRef<HTMLDivElement>(null)
  const drag = useRef<{ id: number; x: number; y: number; px: number; py: number } | null>(null)
  const pinch = useRef<Map<number, { x: number; y: number }>>(new Map())
  const pinchStart = useRef<{ d: number; z: number } | null>(null)

  useEffect(() => {
    const url = URL.createObjectURL(file)
    const i = new Image()
    i.onload = () => { setImg(i); setSrc(url) }
    i.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])

  useEffect(() => {
    const el = frame.current
    if (!el) return
    const ro = new ResizeObserver(() => setFrameW(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [src])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel() }
    document.addEventListener("keydown", onKey)
    document.documentElement.classList.add("is-locked")
    return () => { document.removeEventListener("keydown", onKey); document.documentElement.classList.remove("is-locked") }
  }, [onCancel])

  const frameH = frameW / aspect
  // "cover" scale: the image always fills the frame at zoom 1.
  const base = img && frameW ? Math.max(frameW / img.naturalWidth, frameH / img.naturalHeight) : 1
  const scale = base * zoom
  const dispW = img ? img.naturalWidth * scale : 0
  const dispH = img ? img.naturalHeight * scale : 0
  const clamp = (p: { x: number; y: number }, s = scale) => {
    if (!img) return p
    const mx = Math.max(0, (img.naturalWidth * s - frameW) / 2)
    const my = Math.max(0, (img.naturalHeight * s - frameH) / 2)
    return { x: Math.min(mx, Math.max(-mx, p.x)), y: Math.min(my, Math.max(-my, p.y)) }
  }
  const setZoomClamped = (z: number) => {
    const nz = Math.min(4, Math.max(1, z))
    setZoom(nz)
    setPos((p) => clamp(p, base * nz))
  }

  function down(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId)
    pinch.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pinch.current.size === 2) {
      const [a, b] = [...pinch.current.values()]
      pinchStart.current = { d: Math.hypot(a.x - b.x, a.y - b.y), z: zoom }
      drag.current = null
    } else if (pinch.current.size === 1) {
      drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, px: pos.x, py: pos.y }
    }
  }
  function move(e: React.PointerEvent) {
    if (!pinch.current.has(e.pointerId)) return
    pinch.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pinch.current.size === 2 && pinchStart.current) {
      const [a, b] = [...pinch.current.values()]
      setZoomClamped(pinchStart.current.z * (Math.hypot(a.x - b.x, a.y - b.y) / pinchStart.current.d))
      return
    }
    const d = drag.current
    if (d && d.id === e.pointerId) setPos(clamp({ x: d.px + (e.clientX - d.x), y: d.py + (e.clientY - d.y) }))
  }
  function up(e: React.PointerEvent) {
    pinch.current.delete(e.pointerId)
    if (pinch.current.size < 2) pinchStart.current = null
    if (drag.current?.id === e.pointerId) drag.current = null
  }

  async function confirm() {
    if (!img || !frameW) return
    setWorking(true)
    // Frame rectangle in image pixels.
    const sw = frameW / scale, sh = frameH / scale
    const sx = img.naturalWidth / 2 - pos.x / scale - sw / 2
    const sy = img.naturalHeight / 2 - pos.y / scale - sh / 2
    const ow = Math.min(outWidth, Math.round(sw)) || outWidth
    const canvas = document.createElement("canvas")
    canvas.width = ow
    canvas.height = Math.round(ow / aspect)
    const ctx = canvas.getContext("2d")!
    ctx.imageSmoothingQuality = "high"
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((b) => { setWorking(false); if (b) onConfirm(b) }, "image/webp", 0.88)
  }

  return createPortal(
    <div className="crop" role="dialog" aria-modal="true" aria-label="Crop image">
      <div className="crop__panel">
        <div className="crop__head">
          <b>Crop and position</b>
          <small>Drag to move. Use the slider or pinch to zoom.</small>
        </div>
        <div
          ref={frame}
          className={`crop__frame${round ? " crop__frame--round" : ""}`}
          style={{ aspectRatio: String(aspect) }}
          onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
          onWheel={(e) => setZoomClamped(zoom * (e.deltaY < 0 ? 1.06 : 0.94))}
        >
          {src && img && frameW > 0 && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="" draggable={false} style={{ width: dispW, height: dispH, transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))` }} />
          )}
          <span className="crop__grid" aria-hidden="true" />
        </div>
        <label className="crop__zoom">
          <span className="sr-only">Zoom</span>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="11" cy="11" r="6" /><path d="M8 11h6M20 20l-4.5-4.5" strokeLinecap="round" /></svg>
          <input type="range" min={1} max={4} step={0.01} value={zoom} onChange={(e) => setZoomClamped(Number(e.target.value))} />
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="11" cy="11" r="6" /><path d="M8 11h6M11 8v6M20 20l-4.5-4.5" strokeLinecap="round" /></svg>
        </label>
        <div className="crop__actions">
          <button type="button" className="btn btn--ghost btn--plain" onClick={onCancel} disabled={working}>Cancel</button>
          <button type="button" className="btn btn--primary btn--plain" onClick={confirm} disabled={!img || working}>{working ? "Saving…" : "Use this crop"}</button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
