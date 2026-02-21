import { SignIn } from "@clerk/nextjs"
import { getTranslations } from "next-intl/server"

export default async function SignInPage() {
  const t = await getTranslations("auth")

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg">
            IC
          </div>
          <h1 className="mt-4 text-2xl font-bold">{t("welcomeBack")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("signInDescription")}
          </p>
        </div>
        <SignIn
          forceRedirectUrl="/auth-callback"
          appearance={{
            elements: {
              rootBox: "mx-auto w-full",
              card: "shadow-none border rounded-xl",
            },
          }}
        />
      </div>
    </div>
  )
}
