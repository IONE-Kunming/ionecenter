import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "@/components/language-switcher"

export default async function GuestLayout({ children }: { children: React.ReactNode }) {
  const nav = await getTranslations("nav")

  return (
    <div className="min-h-screen bg-[#000000] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#131923]/90 backdrop-blur-md">
        <div className="max-w-[1320px] mx-auto flex h-16 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C4EF17] text-black font-bold text-lg">
              IC
            </div>
            <span className="text-xl font-bold text-white">IONE Center</span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/sign-in">
              <Button variant="ghost" size="sm" className="text-[#ABB8C3] hover:text-white">{nav("logIn")}</Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="bg-[#C4EF17] text-black hover:bg-[#d4ff27]">{nav("signUpFree")}</Button>
            </Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
