"use client"

import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ShieldWarning, ShieldCheck, Fingerprint, Lock } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

interface ChallengeModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: (method: string) => void
    type: "3ds" | "biometric"
}

export function ChallengeModal({ isOpen, onOpenChange, onConfirm }: ChallengeModalProps) {
    const [selected, setSelected] = React.useState<string | null>(null)
    const [biometricMethod, setBiometricMethod] = React.useState<'faceid' | 'touchid' | null>(null)
    const [showBiometricOptions, setShowBiometricOptions] = React.useState(false)

    const handleVerificationTypeSelect = (type: string) => {
        setSelected(type)
        if (type === 'biometric') {
            setShowBiometricOptions(true)
        } else {
            setShowBiometricOptions(false)
            setBiometricMethod(null)
        }
    }

    const handleConfirm = () => {
        if (selected === 'biometric' && biometricMethod) {
            onConfirm(biometricMethod)
        } else if (selected === '3ds') {
            onConfirm('3ds')
        }
    }

    const handleBack = () => {
        setShowBiometricOptions(false)
        setBiometricMethod(null)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Lock size={24} className="text-primary" />
                        {showBiometricOptions ? 'Choose Biometric Method' : 'Verification Required'}
                    </DialogTitle>
                    <DialogDescription>
                        {showBiometricOptions
                            ? 'Select your preferred biometric authentication method'
                            : 'Halo has detected a high-value transaction. Please verify your identity to proceed.'}
                    </DialogDescription>
                </DialogHeader>

                {!showBiometricOptions ? (
                    <div className="flex flex-col gap-4 py-4">
                        <button
                            onClick={() => handleVerificationTypeSelect("3ds")}
                            className={cn(
                                "flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                                selected === "3ds" ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
                            )}
                        >
                            <ShieldCheck size={32} className="text-primary" />
                            <div>
                                <div className="font-bold">3D Secure v2</div>
                                <div className="text-xs text-muted-foreground">Standard bank verification via SMS/App</div>
                            </div>
                        </button>
                        <button
                            onClick={() => handleVerificationTypeSelect("biometric")}
                            className={cn(
                                "flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                                selected === "biometric" ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
                            )}
                        >
                            <Fingerprint size={32} className="text-primary" />
                            <div>
                                <div className="font-bold">Biometric Auth</div>
                                <div className="text-xs text-muted-foreground">Verify using FaceID or TouchID</div>
                            </div>
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 py-4">
                        <button
                            onClick={() => setBiometricMethod('faceid')}
                            className={cn(
                                "flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                                biometricMethod === "faceid" ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
                            )}
                        >
                            <div className="text-3xl">👤</div>
                            <div>
                                <div className="font-bold">Face ID</div>
                                <div className="text-xs text-muted-foreground">Use facial recognition for secure authentication</div>
                            </div>
                        </button>
                        <button
                            onClick={() => setBiometricMethod('touchid')}
                            className={cn(
                                "flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                                biometricMethod === "touchid" ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
                            )}
                        >
                            <Fingerprint size={32} className="text-emerald-400" />
                            <div>
                                <div className="font-bold">Touch ID</div>
                                <div className="text-xs text-muted-foreground">Use fingerprint sensor for quick verification</div>
                            </div>
                        </button>
                    </div>
                )}

                <DialogFooter>
                    {showBiometricOptions && (
                        <Button variant="ghost" onClick={handleBack}>Back</Button>
                    )}
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        disabled={!selected || (selected === 'biometric' && !biometricMethod)}
                        onClick={handleConfirm}
                    >
                        Verify & Continue
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export function BlockModal({ isOpen, onOpenChange, reason, factors }: { isOpen: boolean, onOpenChange: (open: boolean) => void, reason: string, factors: string[] }) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md border-destructive/20 bg-destructive/5">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <ShieldWarning size={28} weight="fill" />
                        Transaction Blocked
                    </DialogTitle>
                    <DialogDescription className="text-destructive/80 font-medium">
                        Halo Risk Engine has blocked this transaction to protect your account.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="rounded-lg bg-white p-4 border border-destructive/10 shadow-sm">
                        <div className="text-xs uppercase font-bold text-muted-foreground mb-1">Reason</div>
                        <div className="text-sm font-semibold">{reason}</div>
                    </div>
                    <div className="space-y-2">
                        <div className="text-[10px] uppercase font-bold text-muted-foreground">Identified Risk Factors</div>
                        <div className="flex flex-wrap gap-2">
                            {factors.map(f => (
                                <span key={f} className="px-2 py-1 rounded-full bg-destructive/10 text-destructive text-[9px] font-bold uppercase tracking-wider">
                                    {f}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>Close</Button>
                    <Button variant="destructive" className="w-full" onClick={() => alert("Appeal submitted.")}>Appeal Decision</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
