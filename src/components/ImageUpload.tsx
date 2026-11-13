"use client"

import { useRef, useState, useTransition } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Bucket } from "@/lib/storage"
import { Icon } from "./Icon"
import { Loader } from "./Loader"
import { CropDialog } from "./CropDialog"

type SaveAction = (url: string) => Promise<{ ok: boolean; message?: string }>


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
  const [picked, setPicked] = useState<File | null>(null)

  // Picking a file opens the crop step; nothing uploads until the crop is confirmed.
  function onFile(file: File) {
    setError(null)
    if (input.current) input.current.value = ""
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return setError("Use a JPG, PNG or WebP image.")
    if (file.size > 15 * 1024 * 1024) return setError("That image is over 15 MB. Choose a smaller one.")
    setPicked(file)
  }

  async function upload(blob: Blob) {
    setPicked(null)
    setBusy(true)
    try {
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
      {picked && (
        <CropDialog file={picked} aspect={shape === "banner" ? 2 : 1} outWidth={shape === "banner" ? 1600 : 512} round={shape === "logo"} onCancel={() => setPicked(null)} onConfirm={upload} />
      )}
      <div className="upload__frame" aria-busy={busy}>
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" />
        ) : (
          <span className="upload__empty"><Icon name="image" size={shape === "banner" ? 32 : 24} /></span>
        )}
        {busy && <span className="upload__busy"><Loader size={48} /><span>Uploading…</span></span>}
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
