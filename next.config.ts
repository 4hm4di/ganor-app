import type { NextConfig } from "next"

// Pages depend on the signed-in host (cookies), so they render per request.
// Cache Components can come later for public event pages.
const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Rating links carry a private token: never leak it in referrers, caches or search indexes.
  // The homepage is the ganor.ng landing page, exported in launch mode into public/ (tools/export_app.py in the site repo).
  async rewrites() {
    return { beforeFiles: [{ source: "/", destination: "/index.html" }], afterFiles: [], fallback: [] }
  },
  async headers() {
    return [
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
