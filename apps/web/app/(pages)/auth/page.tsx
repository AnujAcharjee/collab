"use client"

import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { IconShieldCheck, IconLoader2 } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { pramaanAuthApiUrl } from "@/constants/apiUrls"
import { AppIcon } from "@/components/AppIcon"

function buildPramaanUrl(mode: "signin" | "signup") {
  const url = new URL(pramaanAuthApiUrl)
  url.searchParams.set("mode", mode)
  return url.toString()
}

export default function AuthPage() {
  const searchParams = useSearchParams()
  const mode = searchParams.get("mode") === "signup" ? "signup" : "signin"
  const error = searchParams.get("error")

  const [loading, setLoading] = useState<"signin" | "signup" | null>(null)

  const signinUrl = useMemo(() => buildPramaanUrl("signin"), [])
  const signupUrl = useMemo(() => buildPramaanUrl("signup"), [])

  const isSignup = mode === "signup"

  function handleNavigate(url: string, type: "signin" | "signup") {
    setLoading(type)
    window.location.href = url
  }

  return (
    <div className="relative flex min-h-svh w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(244,187,68,0.18),transparent_30%),linear-gradient(135deg,#fff8eb_0%,#fffdf8_45%,#f6f1e7_100%)] px-6 py-16 text-foreground dark:bg-[radial-gradient(circle_at_top,rgba(244,187,68,0.10),transparent_35%),linear-gradient(135deg,#18181b_0%,#09090b_60%,#18181b_100%)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(123,77,22,0.06)_35%,transparent_70%)] dark:bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.05)_35%,transparent_70%)]" />

      <Card className="relative w-full max-w-xl border border-border/60 bg-card/90 shadow-[0_24px_80px_rgba(0,0,0,0.12)] backdrop-blur dark:bg-card/70">
        <CardHeader className="space-y-6 pb-2">
          <CardTitle className="flex items-center gap-2 text-xs font-semibold tracking-[0.28em] text-primary uppercase">
            <AppIcon size="sm" />
          </CardTitle>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-foreground">
              {isSignup ? "Create your account" : "Welcome back"}
            </h1>

            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              {isSignup
                ? "Get started with Collab by creating your account via Pramaan. It's fast, secure, and seamless."
                : "Sign in to continue to Collab using your secure Pramaan identity."}
            </p>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col items-center justify-center space-y-6 pt-6">
          {error && (
            <div className="w-full rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid w-full gap-3 sm:grid-cols-2">
            <Button
              size="lg"
              className="h-12 rounded-xl text-sm font-semibold"
              disabled={loading !== null}
              onClick={() => handleNavigate(signinUrl, "signin")}
            >
              {loading === "signin" ? (
                <>
                  <IconLoader2 className="mr-2 size-4 animate-spin" />
                  Redirecting…
                </>
              ) : (
                "Continue with Pramaan"
              )}
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="h-12 rounded-xl border-amber-200 bg-amber-300 text-sm font-semibold text-amber-900 hover:bg-amber-100 hover:text-amber-900 dark:border-amber-300/30 dark:bg-amber-300/15 dark:text-amber-100 dark:hover:bg-amber-300/20 dark:hover:text-amber-100"
              disabled={loading !== null}
              onClick={() => handleNavigate(signupUrl, "signup")}
            >
              {loading === "signup" ? (
                <>
                  <IconLoader2 className="mr-2 size-4 animate-spin" />
                  Redirecting…
                </>
              ) : (
                "Create new account"
              )}
            </Button>
          </div>

          <div className="w-full">
            <div className="space-y-1 space-x-2 rounded-xl border border-border/60 bg-muted/40 px-4 py-3">
              <p className="flex gap-2">
                <IconShieldCheck className="mt-0.5 size-4 text-emerald-600" />
                <span className="text-xs leading-5 font-semibold text-foreground">
                  Pramaan verified.
                </span>
              </p>

              <p className="text-xs leading-5 text-muted-foreground">
                Your authentication is handled securely using encrypted identity
                protocols.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
