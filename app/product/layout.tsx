import Image from "next/image"
import Link from "@/components/ui/link"
import { getTranslations } from "next-intl/server"
import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"

export default async function ProductDetailLayout({ children }: { children: React.ReactNode }) {
  const tNav = await getTranslations("nav")
  const tFooter = await getTranslations("footer")

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
        <div className="max-w-[1480px] mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="IONE Center" width={130} height={36} className="h-9 w-auto" />
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/about" className="hidden md:inline-flex text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5">
              {tFooter("aboutUs")}
            </Link>
            <LanguageSwitcher />
            <ThemeToggle />
            <Link href="/sign-up?intent=seller">
              <Button size="sm" variant="outline" className="hidden sm:inline-flex">
                {tFooter("becomeASeller")}
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                {tNav("logIn")}
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="hidden sm:inline-flex">
                {tNav("signUpFree")}
              </Button>
            </Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
