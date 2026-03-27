"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { deepShadow } from "@/lib/styles"

export default function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin")

  const isSignIn = mode === "signin"

  return (
    <Card className="w-full sm:max-w-md" style={{ boxShadow: deepShadow }}>
      <CardHeader>
        <CardTitle className="text-2xl">
          {isSignIn ? "Welcome back" : "Create an account"}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {isSignIn
            ? "Sign in to your account to continue"
            : "Get started by creating a new account"}
        </p>
      </CardHeader>

      <CardContent>
        <Button className="w-full" size="lg">
          {isSignIn ? "Sign in with Pramaan" : "Sign up with Pramaan"}
        </Button>
      </CardContent>

      <CardFooter className="justify-center">
        {isSignIn ? (
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <button
              onClick={() => setMode("signup")}
              className="font-medium text-primary hover:underline"
            >
              Sign up
            </button>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <button
              onClick={() => setMode("signin")}
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </button>
          </p>
        )}
      </CardFooter>
    </Card>
  )
}
