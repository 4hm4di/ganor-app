export type Bucket = "event-banners" | "host-logos"

export function publicPrefix(bucket: Bucket, userId: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${userId}/`
}

// Only accept image URLs that point into the signed-in host's own folder in our bucket.
export function isOwnImage(url: string, bucket: Bucket, userId: string) {
  return url.startsWith(publicPrefix(bucket, userId)) && /^[\w-]+\.(webp|jpg|jpeg|png)$/.test(url.slice(publicPrefix(bucket, userId).length))
}

export function objectPath(url: string | null, bucket: Bucket) {
  if (!url) return null
  const marker = `/storage/v1/object/public/${bucket}/`
  const i = url.indexOf(marker)
  return i === -1 ? null : url.slice(i + marker.length)
}
