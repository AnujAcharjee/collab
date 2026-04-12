"use client"

import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { IconShieldCheck, IconSparkles, IconLoader2 } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { pramaanAuthApiUrl } from "@/constants/apiUrls"

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
    <div className="relative flex min-h-svh w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(244,187,68,0.18),transparent_30%),linear-gradient(135deg,#fff8eb_0%,#fffdf8_45%,#f6f1e7_100%)] px-6 py-16">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(123,77,22,0.06)_35%,transparent_70%)]" />

      <Card className="relative w-full max-w-xl border-stone-200/80 bg-white/90 shadow-[0_24px_80px_rgba(105,72,32,0.16)] backdrop-blur">
        <CardHeader className="space-y-6 pb-2">
          <CardTitle className="flex items-center gap-2 text-xs font-semibold tracking-[0.28em] text-amber-700 uppercase">
            <IconSparkles className="size-4" />
            Collab Auth
          </CardTitle>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-stone-900">
              {isSignup ? "Create your account" : "Welcome back"}
            </h1>

            <p className="max-w-md text-sm leading-6 text-stone-600">
              {isSignup
                ? "Get started with Collab by creating your account via Pramaan. It's fast, secure, and seamless."
                : "Sign in to continue to Collab using your secure Pramaan identity."}
            </p>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col items-center justify-center space-y-6 pt-6">
          {error && (
            <div className="w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
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
              className="h-12 rounded-xl border-amber-200 bg-amber-300 text-sm font-semibold text-amber-900 hover:bg-amber-100 hover:text-amber-900"
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
            <div className="space-y-1 space-x-2 rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-3">
              <p className="flex gap-2">
                <IconShieldCheck className="mt-0.5 size-4 text-emerald-600" />
                <span className="text-xs leading-5 font-semibold text-stone-700">
                  Pramaan verified.
                </span>
              </p>

              <p className="text-xs leading-5 text-stone-600">
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
