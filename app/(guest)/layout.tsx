import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "@/components/language-switcher"

export default async function GuestLayout({ children }: { children: React.ReactNode }) {
  const nav = await getTranslations("nav")

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              IC
            </div>
            <span className="text-xl font-bold">IONE Center</span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">{nav("logIn")}</Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm">{nav("signUpFree")}</Button>
            </Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
