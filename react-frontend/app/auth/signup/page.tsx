"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Spinner } from "@phosphor-icons/react"

export default function SignupPage() {
    const router = useRouter()

    useEffect(() => {
        router.replace('/auth/login')
    }, [router])

    return (
        <div className="flex h-screen w-full items-center justify-center bg-transparent">
            <Spinner className="animate-spin text-white" size={32} />
        </div>
    )
}
