import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import { Header } from "@/components/Header"
import { Motion } from "@/components/Motion"
import { Toaster } from "@/components/Toaster"
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F1E7" },
    { media: "(prefers-color-scheme: dark)", color: "#0E0D18" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

const THEME_SCRIPT = `(function(){try{var d=document.documentElement,m=matchMedia('(prefers-color-scheme: dark)');function t(){var c=document.cookie.match(/(?:^|; )ganor_theme=(system|light|dark)/);return c?c[1]:'system'}function a(){var v=t();d.classList.toggle('theme-dark',v==='dark'||(v==='system'&&m.matches))}a();m.addEventListener('change',a)}catch(e){}})()`

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${bricolage.variable}`} suppressHydrationWarning>
      <head>
        {/* Motion styles apply only once JS runs, so content never stays hidden without it. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        {/* Theme before first paint: ganor_theme cookie (system by default) + the device setting. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <Header />
        <Motion />
        <Toaster />
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
