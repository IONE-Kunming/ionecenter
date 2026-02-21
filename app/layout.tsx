import type { Metadata } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import { NextIntlClientProvider } from "next-intl"
import { getLocale, getMessages } from "next-intl/server"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "IONE Center - B2B Ecommerce Trading Platform",
  description:
    "Your trusted B2B ecommerce platform for trading products with verified suppliers worldwide.",
  keywords: [
    "B2B",
    "ecommerce",
    "trading",
    "wholesale",
    "marketplace",
    "suppliers",
  ],
}

const isClerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  const messages = await getMessages()

  const content = (
    <html lang={locale} dir={locale === "ar" || locale === "ur" ? "rtl" : "ltr"} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )

  if (isClerkConfigured) {
    return <ClerkProvider>{content}</ClerkProvider>
  }

  return content
}
