"use client"

import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Fingerprint, FingerprintSimple, DeviceMobile } from "@phosphor-icons/react"

interface BiometricSetupModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSetupComplete: (method: 'faceid' | 'touchid' | 'fingerprint') => void
    amount: number
}

export function BiometricSetupModal({
    open,
    onOpenChange,
    onSetupComplete,
    amount
}: BiometricSetupModalProps) {
    const [selectedMethod, setSelectedMethod] = React.useState<'faceid' | 'touchid' | 'fingerprint' | null>(null)

    const biometricOptions = [
        {
            id: 'faceid' as const,
            name: 'Face ID',
            description: 'Use facial recognition for secure authentication',
            icon: <DeviceMobile size={32} weight="fill" className="text-blue-400" />,
            available: true
        },
        {
            id: 'touchid' as const,
            name: 'Touch ID',
            description: 'Use fingerprint sensor for quick verification',
            icon: <FingerprintSimple size={32} weight="fill" className="text-emerald-400" />,
            available: true
        },
        {
            id: 'fingerprint' as const,
            name: 'Fingerprint',
            description: 'Use device fingerprint scanner',
            icon: <Fingerprint size={32} weight="fill" className="text-purple-400" />,
            available: true
        }
    ]

    const handleConfirm = () => {
        if (selectedMethod) {
            onSetupComplete(selectedMethod)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md rounded-[2rem] bg-zinc-950 border-white/5">
                <DialogHeader>
                    <DialogTitle className="text-2xl tracking-tighter text-white">
                        Setup Biometric Authentication
                    </DialogTitle>
                    <DialogDescription className="text-zinc-500 font-light pt-1">
                        High-value transaction detected (${amount})
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-6">
                    {/* Warning Banner */}
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <div className="text-amber-400 text-2xl">🔐</div>
                            <div>
                                <div className="text-sm font-bold text-amber-400 mb-1">
                                    Enhanced Security Required
                                </div>
                                <div className="text-xs text-amber-600/80">
                                    For transactions over $100, biometric verification is required to ensure your account security.
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Biometric Options */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 px-1">
                            Select Authentication Method
                        </label>
                        {biometricOptions.map((option) => (
                            <button
                                key={option.id}
                                onClick={() => setSelectedMethod(option.id)}
                                disabled={!option.available}
                                className={`
                                    w-full flex items-center gap-4 p-4 rounded-xl border transition-all
                                    ${selectedMethod === option.id
                                        ? 'bg-white/10 border-white/30 scale-[1.02]'
                                        : 'bg-zinc-900/30 border-white/5 hover:border-white/20 hover:bg-white/5'
                                    }
                                    ${!option.available && 'opacity-40 cursor-not-allowed'}
                                `}
                            >
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                                    {option.icon}
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="text-sm font-bold text-white mb-1">
                                        {option.name}
                                    </div>
                                    <div className="text-xs text-zinc-500">
                                        {option.description}
                                    </div>
                                </div>
                                {selectedMethod === option.id && (
                                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-white" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Confirm Button */}
                    <div className="pt-4 border-t border-white/5">
                        <Button
                            onClick={handleConfirm}
                            disabled={!selectedMethod}
                            className="w-full h-12 rounded-xl bg-white text-black hover:bg-zinc-100 font-bold text-sm disabled:opacity-50"
                        >
                            {selectedMethod ? `Continue with ${biometricOptions.find(o => o.id === selectedMethod)?.name}` : 'Select a Method'}
                        </Button>
                    </div>

                    {/* Info Text */}
                    <div className="text-center text-[10px] text-zinc-600">
                        Your biometric data is processed securely on your device
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
