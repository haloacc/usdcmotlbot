"use client"

import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CheckCircle, Spinner } from "@phosphor-icons/react"

interface OTPVerificationModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onVerified: () => void
    generatedOTP: string
}

export function OTPVerificationModal({
    open,
    onOpenChange,
    onVerified,
    generatedOTP
}: OTPVerificationModalProps) {
    const [otp, setOtp] = React.useState("")
    const [isVerifying, setIsVerifying] = React.useState(false)
    const [isVerified, setIsVerified] = React.useState(false)

    // Auto-fill OTP after a brief delay to showcase the feature
    React.useEffect(() => {
        if (open && generatedOTP) {
            const timer = setTimeout(() => {
                setOtp(generatedOTP)
            }, 3000) // Increased from 800ms to 3000ms
            return () => clearTimeout(timer)
        }
    }, [open, generatedOTP])

    const handleVerify = async () => {
        setIsVerifying(true)

        // Simulate verification delay
        await new Promise(resolve => setTimeout(resolve, 1500))

        setIsVerifying(false)
        setIsVerified(true)

        // Wait a moment to show success state
        setTimeout(() => {
            onVerified()
            // Reset state for next use
            setTimeout(() => {
                setOtp("")
                setIsVerified(false)
            }, 300)
        }, 800)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md rounded-[2rem] bg-zinc-950 border-white/5">
                <DialogHeader>
                    <DialogTitle className="text-2xl tracking-tighter text-white">
                        Verify Your Card
                    </DialogTitle>
                    <DialogDescription className="text-zinc-500 font-light pt-1">
                        Two-factor authentication for secure card storage
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 pt-6">
                    {/* OTP Display Banner */}
                    <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-xl p-4">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-2">
                            Your OTP to add card in Halo
                        </div>
                        <div className="text-3xl font-mono font-black tracking-[0.5em] text-white">
                            {generatedOTP}
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-2">
                            Enter this code below to verify your card
                        </div>
                    </div>

                    {/* OTP Input */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 px-1">
                            Enter OTP
                        </label>
                        <Input
                            type="password"
                            placeholder="••••••"
                            className="h-14 bg-zinc-900/50 border-white/5 focus-visible:ring-white/10 rounded-xl font-mono text-2xl tracking-[0.3em] text-center"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            maxLength={6}
                            disabled={isVerifying || isVerified}
                        />
                    </div>

                    {/* Verify Button */}
                    <Button
                        onClick={handleVerify}
                        disabled={otp.length !== 6 || isVerifying || isVerified}
                        className="w-full h-12 rounded-xl bg-white text-black hover:bg-zinc-100 font-bold text-sm disabled:opacity-50"
                    >
                        {isVerifying ? (
                            <div className="flex items-center gap-2">
                                <Spinner className="animate-spin" size={18} />
                                Verifying...
                            </div>
                        ) : isVerified ? (
                            <div className="flex items-center gap-2">
                                <CheckCircle size={18} weight="fill" className="text-green-600" />
                                Verified Successfully
                            </div>
                        ) : (
                            "Verify OTP"
                        )}
                    </Button>

                    {/* Info Text */}
                    <div className="text-center text-[10px] text-zinc-600">
                        This is a demo of 2FA verification for card security
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
