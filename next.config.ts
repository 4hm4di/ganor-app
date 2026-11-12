import type { NextConfig } from "next"

// Pages depend on the signed-in host (cookies), so they render per request.
// Cache Components can come later for public event pages.
const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Rating links carry a private token: never leak it in referrers, caches or search indexes.
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
