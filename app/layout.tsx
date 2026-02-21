import type { Metadata } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "IONE AlumaTech - B2B Aluminum & Construction Materials Trading Platform",
  description:
    "Trade aluminum profiles, sheets, glass products, and construction materials with trusted suppliers worldwide.",
  keywords: [
    "aluminum",
    "B2B",
    "trading",
    "construction materials",
    "aluminum profiles",
    "wholesale",
  ],
}

const isClerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const content = (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )

  if (isClerkConfigured) {
    return <ClerkProvider>{content}</ClerkProvider>
  }

  return content
}
