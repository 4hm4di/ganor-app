import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import { Header } from "@/components/Header"
import "./globals.css"

const inter = localFont({
  src: [
    { path: "./fonts/inter-latin.woff2", weight: "100 900", style: "normal" },
    { path: "./fonts/inter-latin-ext.woff2", weight: "100 900", style: "normal" },
  ],
  variable: "--font-inter",
  display: "swap",
})

const bricolage = localFont({
  src: "./fonts/bricolage-grotesque-latin.woff2",
  weight: "200 800",
  variable: "--font-bricolage",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://app.ganor.ng"),
  title: { default: "Ganor · Your city, found.", template: "%s · Ganor" },
  description: "Create events, sell tickets and check guests in with any phone.",
}

export const viewport: Viewport = {
  themeColor: "#F6F1E7",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${bricolage.variable}`}>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <Header />
        <main id="main">{children}</main>
        <footer className="foot">
          <div className="wrap foot__in">
            <span>Ganor · Your city, found.</span>
            <span>
              <a href="https://ganor.ng/terms.html">Terms</a> · <a href="https://ganor.ng/privacy.html">Privacy</a> · <a href="mailto:support@ganor.ng">support@ganor.ng</a>
            </span>
          </div>
        </footer>
      </body>
    </html>
  )
}
