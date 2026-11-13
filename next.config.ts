import type { NextConfig } from "next"

const SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://*.supabase.co"
const SUPABASE_WS = SUPABASE.replace(/^https:/, "wss:")

// Content Security Policy: the browser only loads code, images and connections from these places.
// Stops injected scripts from sending data elsewhere, and stops other sites framing Ganor (clickjacking).
// Paystack is listed ahead of checkout going live.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://js.paystack.co",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${SUPABASE}`,
  "font-src 'self' data:",
  `connect-src 'self' ${SUPABASE} ${SUPABASE_WS} https://formsubmit.co https://*.sibforms.com https://api.paystack.co`,
  "frame-src https://checkout.paystack.com",
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://formsubmit.co https://*.sibforms.com",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ")

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=(self), usb=(), interest-cohort=()" },
  // Asks AI tools not to train on pages or images (honoured by some; robots.txt and the proxy do the rest).
  { key: "X-Robots-Tag", value: "noai, noimageai" },
]

// Signed-in and private pages: never stored by browsers, proxies or search engines.
const PRIVATE_HEADERS = [
  { key: "Cache-Control", value: "private, no-store, max-age=0" },
  { key: "X-Robots-Tag", value: "noindex, nofollow, noai, noimageai" },
]

// Pages depend on the signed-in host (cookies), so they render per request.
// Cache Components can come later for public event pages.
const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Fonts read at runtime by the guest-list PDF.
  outputFileTracingIncludes: { "/dashboard/events/[id]/guests": ["./src/lib/pdf-fonts/**"] },
  // Rating links carry a private token: never leak it in referrers, caches or search indexes.
  // The homepage is the ganor.ng landing page, exported in launch mode into public/ (tools/export_app.py in the site repo).
  async rewrites() {
    return { beforeFiles: [{ source: "/", destination: "/index.html" }], afterFiles: [], fallback: [] }
  },
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      { source: "/dashboard/:path*", headers: PRIVATE_HEADERS },
      { source: "/dashboard", headers: PRIVATE_HEADERS },
      { source: "/gate/:path*", headers: PRIVATE_HEADERS },
      { source: "/gate", headers: PRIVATE_HEADERS },
      { source: "/hq/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noai, noimageai" }, { key: "Referrer-Policy", value: "no-referrer" }, { key: "Cache-Control", value: "private, no-store, max-age=0" }] },
      { source: "/hq", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noai, noimageai" }, { key: "Referrer-Policy", value: "no-referrer" }, { key: "Cache-Control", value: "private, no-store, max-age=0" }] },
      {
        source: "/r/:token*",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Cache-Control", value: "no-store, max-age=0" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ]
  },
}

export default nextConfig
