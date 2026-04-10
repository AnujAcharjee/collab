"use client"

import { useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { IconShieldCheck, IconSparkles } from "@tabler/icons-react"
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

  const signinUrl = useMemo(() => buildPramaanUrl("signin"), [])
  const signupUrl = useMemo(() => buildPramaanUrl("signup"), [])

  return (
    <div className="relative flex min-h-svh w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(244,187,68,0.18),transparent_30%),linear-gradient(135deg,#fff8eb_0%,#fffdf8_45%,#f6f1e7_100%)] px-6 py-16">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(123,77,22,0.06)_35%,transparent_70%)]" />

      <Card className="relative w-full max-w-xl border-stone-200/80 bg-white/90 shadow-[0_24px_80px_rgba(105,72,32,0.16)] backdrop-blur">
        <CardHeader className="space-y-5 pb-2">
          <div className="flex items-center gap-2 text-sm font-medium tracking-[0.24em] text-amber-700 uppercase">
            <IconSparkles className="size-4" />
            Auth
          </div>

          <div className="space-y-3">
            <CardTitle className="text-4xl leading-tight font-semibold text-stone-900">
              Sign {mode === "signup" ? "up" : "in"} with Pramaan
            </CardTitle>
            <p className="max-w-lg text-base leading-7 text-stone-600">
              Use your Pramaan identity to enter Collab. We&apos;ll verify your
              account, create your local profile if needed, and send you
              straight into your workspace.
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Button asChild size="lg" className="h-12 rounded-xl text-sm font-semibold">
              <a href={signinUrl}>Sign in with Pramaan</a>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-xl border-amber-200 bg-amber-50 text-sm font-semibold text-amber-900 hover:bg-amber-100"
            >
              <a href={signupUrl}>Sign up with Pramaan</a>
            </Button>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4">
            <div className="flex items-start gap-3">
              <IconShieldCheck className="mt-0.5 size-5 text-emerald-600" />
              <div className="space-y-1 text-sm text-stone-600">
                <p className="font-medium text-stone-900">
                  One trusted sign-in path
                </p>
                <p>
                  Both buttons use the live Pramaan OAuth route exposed by the
                  HTTP service and return here automatically if something goes
                  wrong.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
