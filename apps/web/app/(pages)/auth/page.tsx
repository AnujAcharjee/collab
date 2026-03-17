"use client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { createUserFromSchema, type CreateUserInput } from "@repo/validation"
import axios from "axios"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

const toastOptions = {
  position: "top-center" as const,
  style: {
    "--border-radius": "calc(var(--radius) + 4px)",
  } as React.CSSProperties,
}

export default function AuthForm() {
  const userArvUrl = process.env.NEXT_PUBLIC_USER_SRV_URL
  const router = useRouter()

  const [isPending, setIsPending] = useState(false)

  const form = useForm<CreateUserInput>({
    resolver: zodResolver(createUserFromSchema),
    defaultValues: {
      email: "",
      username: "",
    },
  })

  async function onSubmit(data: CreateUserInput) {
    setIsPending(true)

    try {
      const res = await axios.post(`${userArvUrl}`, { ...data })

      router.push(`/chat/${res.data.data.user.id}`)
      toast.success("Account created 🎉🎉", toastOptions)
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.message ?? "Something went wrong")
        : "Something went wrong"

      toast.error(message, toastOptions)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Card className="w-full sm:max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Create Account</CardTitle>
      </CardHeader>
      <CardContent>
        <form id="form-rhf-signup" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-signup-email">Email</FieldLabel>
                  <Input
                    {...field}
                    id="form-rhf-signup-email"
                    aria-invalid={fieldState.invalid}
                    placeholder="Enter a valid email"
                    autoComplete="email"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="username"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-signup-username">
                    Username
                  </FieldLabel>
                  <Input
                    {...field}
                    id="form-rhf-signup-username"
                    aria-invalid={fieldState.invalid}
                    placeholder="Create a unique username"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col gap-3">
        <Button
          type="submit"
          disabled={isPending}
          form="form-rhf-signup"
          className="w-full"
        >
          {isPending ? "Processing..." : "Sign up"}
        </Button>
        {/* <p className="text-center text-sm text-muted-foreground">
          Have an account?{" "}
          <Link
            href="/signin"
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </p> */}
      </CardFooter>
    </Card>
  )
}
