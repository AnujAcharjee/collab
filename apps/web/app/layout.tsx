import { Geist_Mono, Raleway } from "next/font/google"
import type { Metadata } from "next"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/sonner"

const raleway = Raleway({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://collab.anujacharjee.com"),
  title: "Collab",
  description:
    "A real-time collaboration platform that breaks language barriers — talk to anyone, in any language, anywhere in the world.",

  // Open Graph — controls how link looks
  openGraph: {
    title: "Collab",
    description: "A modern collab application",
    url: "https://collab.anujacharjee.com",
    images: ["/og-image.png"],
  },

  // Controls search engine crawling
  robots: {
    index: true,
    follow: true,
  },

  icons: {
    icon: [
      { url: "/logo/favicon.ico" },
      { url: "/logo/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/logo/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/logo/apple-touch-icon.png", sizes: "180x180" }],
    other: [
      { rel: "icon", url: "/logo/favicon-192x192.png", sizes: "192x192" },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        raleway.variable
      )}
    >
      <body className="flex min-h-screen items-center justify-center bg-background">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
