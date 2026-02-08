"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { apiRequest } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, CircleNotch } from "@phosphor-icons/react"
import Link from "next/link"

function VerifyContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get("token")

    const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying")
    const [message, setMessage] = useState("Verifying your email...")

    useEffect(() => {
        if (!token) {
            setStatus("error")
            setMessage("Invalid verification link. No token found.")
            return
        }

        const verifyToken = async () => {
            try {
                const result = await apiRequest(`/api/auth/verify`, {
                    method: 'POST',
                    body: JSON.stringify({ token })
                })

                if (result.success) {
                    setStatus("success")
                    setMessage("Email verified successfully! Redirecting...")
                    setTimeout(() => {
                        router.push('/dashboard')
                    }, 3000)
                } else {
                    setStatus("error")
                    setMessage(result.error || "Verification failed.")
                }
            } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
                console.error("Verification error:", err)
                setStatus("error")
                setMessage(err.message || "An error occurred during verification.")
            }
        }

        verifyToken()
    }, [token, router])

    return (
        <div className="w-full max-w-md rounded-2xl bg-card p-8 shadow-2xl border border-border text-center">
            <div className="mb-6 flex justify-center">
                {status === "verifying" && (
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary animate-pulse">
                        <CircleNotch size={32} className="animate-spin" />
                    </div>
                )}
                {status === "success" && (
                    <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <CheckCircle size={32} weight="fill" />
                    </div>
                )}
                {status === "error" && (
                    <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                        <XCircle size={32} weight="fill" />
                    </div>
                )}
            </div>

            <h1 className="text-2xl font-bold mb-2">
                {status === "verifying" && "Verifying Account"}
                {status === "success" && "Verified!"}
                {status === "error" && "Verification Failed"}
            </h1>

            <p className="text-muted-foreground mb-8">
                {message}
            </p>

            {status === "error" && (
                <Button asChild className="w-full">
                    <Link href="/auth/login">
                        Return to Login
                    </Link>
                </Button>
            )}

            {status === "success" && (
                <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700">
                    <Link href="/dashboard">
                        Go to Dashboard
                    </Link>
                </Button>
            )}
        </div>
    )
}

export default function VerifyPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
            <Suspense fallback={<CircleNotch size={32} className="animate-spin" />}>
                <VerifyContent />
            </Suspense>
        </div>
    )
}
