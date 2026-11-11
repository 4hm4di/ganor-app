"use client"

import { useRef, useState, useTransition } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Bucket } from "@/lib/storage"
import { Icon } from "./Icon"
import { Loader } from "./Loader"

type SaveAction = (url: string) => Promise<{ ok: boolean; message?: string }>

// Shrinks the photo in the browser (max width, WebP) before upload, so pages stay fast on mobile data.
async function shrink(file: File, maxW: number): Promise<Blob> {
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, maxW / bmp.width)
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(bmp.width * scale)
  canvas.height = Math.round(bmp.height * scale)
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
  return await new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("encode"))), "image/webp", 0.86))
}

export function ImageUpload({
  bucket,
  userId,
  current,
  save,
  shape,
  label,
  hint,
}: {
  bucket: Bucket
  userId: string
  current: string | null
  save: SaveAction
  shape: "banner" | "logo"
  label: string
  hint: string
}) {
  const input = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState(current)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [, startTransition] = useTransition()

  async function onFile(file: File) {
    setError(null)
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return setError("Use a JPG, PNG or WebP image.")
    if (file.size > 15 * 1024 * 1024) return setError("That image is over 15 MB. Choose a smaller one.")
    setBusy(true)
    try {
      const blob = await shrink(file, shape === "banner" ? 1600 : 512)
      const path = `${userId}/${crypto.randomUUID()}.webp`
      const supabase = createClient()
      const { error: upErr } = await supabase.storage.from(bucket).upload(path, blob, { contentType: "image/webp", cacheControl: "31536000" })
      if (upErr) throw upErr
      const publicUrl = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
      const res = await save(publicUrl)
      if (!res.ok) throw new Error(res.message)
      setUrl(publicUrl)
      startTransition(() => {})
    } catch (e) {
      setError(e instanceof Error && e.message && !/encode/.test(e.message) ? e.message : "Upload failed. Try again.")
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ""
    }
  }

  async function remove() {
    setBusy(true)
    const res = await save("")
    setBusy(false)
    if (res.ok) setUrl(null)
    else setError(res.message ?? "Couldn't remove it. Try again.")
  }

  return (
    <div className={`upload upload--${shape}`}>
      <div className="upload__frame" aria-busy={busy}>
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" />
        ) : (
          <span className="upload__empty"><Icon name="image" size={shape === "banner" ? 32 : 24} /></span>
        )}
        {busy && <span className="upload__busy"><Loader size={36} /><span>Uploading…</span></span>}
      </div>
      <div className="upload__side">
        <span className="field__label">{label}</span>
        <span className="field__hint">{hint}</span>
        {error && <span className="upload__err" role="alert">{error}</span>}
        <div className="actions" style={{ gap: 8 }}>
          <label className="btn btn--ghost btn--xs" aria-disabled={busy}>
            {url ? "Change" : "Upload"}
            <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={busy} onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          </label>
          {url && <button type="button" className="btn btn--ghost btn--xs" onClick={remove} disabled={busy}>Remove</button>}
        </div>
      </div>
    </div>
  )
}
