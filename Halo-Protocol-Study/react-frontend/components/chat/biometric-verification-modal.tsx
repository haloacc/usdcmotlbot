"use client"

import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { CheckCircle, Spinner } from "@phosphor-icons/react"

interface BiometricVerificationModalProps {
    open: boolean
    onVerified: () => void
    method: 'faceid' | 'touchid' | 'fingerprint'
}

export function BiometricVerificationModal({
    open,
    onVerified,
    method
}: BiometricVerificationModalProps) {
    const [isVerifying, setIsVerifying] = React.useState(false)
    const [isVerified, setIsVerified] = React.useState(false)
    const [scanProgress, setScanProgress] = React.useState(0)

    const methodNames = {
        faceid: 'Face ID',
        touchid: 'Touch ID',
        fingerprint: 'Fingerprint'
    }

    React.useEffect(() => {
        if (!open) {
            setIsVerifying(false)
            setIsVerified(false)
            setScanProgress(0)
            return
        }

        // Auto-start verification
        const startTimer = setTimeout(() => {
            setIsVerifying(true)

            // Simulate scanning progress
            let progress = 0
            const progressInterval = setInterval(() => {
                progress += 10
                setScanProgress(progress)

                if (progress >= 100) {
                    clearInterval(progressInterval)
                    // Complete verification
                    setTimeout(() => {
                        setIsVerifying(false)
                        setIsVerified(true)

                        // Call onVerified after showing success
                        setTimeout(() => {
                            onVerified()
                        }, 800)
                    }, 300)
                }
            }, 150)

            return () => clearInterval(progressInterval)
        }, 500)

        return () => clearTimeout(startTimer)
    }, [open, onVerified])

    return (
        <Dialog open={open} onOpenChange={() => { }}>
            <DialogContent
                className="sm:max-w-md rounded-[2rem] bg-zinc-950 border-white/5"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle className="text-2xl tracking-tighter text-white">
                        {isVerified ? 'Verified' : `Verifying ${methodNames[method]}`}
                    </DialogTitle>
                    <DialogDescription className="text-zinc-500 font-light pt-1">
                        {isVerified ? 'Authentication successful' : 'Please look at your device'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center py-12 space-y-6">
                    {/* Face ID Animation */}
                    {method === 'faceid' && !isVerified && (
                        <div className="relative w-32 h-32">
                            {/* Outer scanning ring */}
                            <div className="absolute inset-0 rounded-full border-4 border-blue-500/20" />

                            {/* Animated scanning ring */}
                            <div
                                className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-400 animate-spin"
                                style={{ animationDuration: '1.5s' }}
                            />

                            {/* Face icon */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-6xl animate-pulse">👤</div>
                            </div>

                            {/* Scanning lines */}
                            <div
                                className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-scan"
                                style={{
                                    top: `${scanProgress}%`,
                                    opacity: isVerifying ? 1 : 0,
                                    transition: 'top 0.15s linear'
                                }}
                            />
                        </div>
                    )}

                    {/* Touch ID / Fingerprint Animation */}
                    {(method === 'touchid' || method === 'fingerprint') && !isVerified && (
                        <div className="relative w-32 h-32">
                            {/* Fingerprint circles */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="relative">
                                    {[0, 1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className="absolute inset-0 rounded-full border-2 border-emerald-400/30 animate-ping"
                                            style={{
                                                animationDelay: `${i * 0.3}s`,
                                                animationDuration: '1.5s',
                                                width: `${32 + i * 16}px`,
                                                height: `${32 + i * 16}px`,
                                                left: `${-i * 8}px`,
                                                top: `${-i * 8}px`
                                            }}
                                        />
                                    ))}
                                    <div className="text-6xl">🔐</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Success State */}
                    {isVerified && (
                        <div className="relative w-32 h-32 flex items-center justify-center">
                            <div className="absolute inset-0 bg-green-500/20 rounded-full animate-pulse" />
                            <CheckCircle size={80} weight="fill" className="text-green-400 animate-in zoom-in duration-300" />
                        </div>
                    )}

                    {/* Status Text */}
                    <div className="text-center space-y-2">
                        {isVerifying && (
                            <>
                                <div className="flex items-center justify-center gap-2 text-sm font-bold text-white">
                                    <Spinner className="animate-spin" size={16} />
                                    Scanning...
                                </div>
                                <div className="text-xs text-zinc-500">
                                    {scanProgress}% complete
                                </div>
                            </>
                        )}
                        {isVerified && (
                            <div className="text-sm font-bold text-green-400">
                                ✓ Authentication Successful
                            </div>
                        )}
                    </div>

                    {/* Progress Bar */}
                    {!isVerified && (
                        <div className="w-full max-w-xs">
                            <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-150 ease-linear"
                                    style={{ width: `${scanProgress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <style jsx>{`
                    @keyframes scan {
                        0%, 100% { opacity: 0; }
                        50% { opacity: 1; }
                    }
                    .animate-scan {
                        animation: scan 1.5s ease-in-out infinite;
                    }
                `}</style>
            </DialogContent>
        </Dialog>
    )
}
