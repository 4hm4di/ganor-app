import type { NextConfig } from "next"

// Pages depend on the signed-in host (cookies), so they render per request.
// Cache Components can come later for public event pages.
const nextConfig: NextConfig = {
  poweredByHeader: false,
}

export default nextConfig
