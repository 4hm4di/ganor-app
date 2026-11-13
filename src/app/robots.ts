import type { MetadataRoute } from "next"
import { AI_BOTS } from "@/lib/bots"

const PRIVATE = ["/dashboard", "/hq", "/gate", "/r/", "/auth/", "/login", "/signup", "/forgot-password", "/reset-password"]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: AI_BOTS, disallow: "/" },
      { userAgent: "*", allow: "/", disallow: PRIVATE },
    ],
  }
}
