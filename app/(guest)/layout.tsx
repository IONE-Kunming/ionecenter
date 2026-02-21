import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function GuestLayout({ children }: { children: React.ReactNode }) {
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
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">Log In</Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm">Sign Up Free</Button>
            </Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
