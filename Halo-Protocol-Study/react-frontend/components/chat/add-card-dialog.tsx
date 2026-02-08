"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Plus, Spinner } from "@phosphor-icons/react"
import { apiRequest } from "@/lib/api"
import { CardValidator } from "@/lib/validators"
import { useToast } from "@/hooks/use-toast"
import { OTPVerificationModal } from "./otp-verification-modal"

interface AddCardDialogProps {
    onSuccess?: () => void
    trigger?: React.ReactNode
}

export function AddCardDialog({ onSuccess, trigger }: AddCardDialogProps) {
    const [open, setOpen] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(false)
    const { toast } = useToast()

    // Phone Number Verification State
    const [showPhoneModal, setShowPhoneModal] = React.useState(false)
    const [phoneNumber, setPhoneNumber] = React.useState("")
    const [isVerifyingPhone, setIsVerifyingPhone] = React.useState(false)

    // OTP Verification State
    const [showOTPModal, setShowOTPModal] = React.useState(false)
    const [generatedOTP, setGeneratedOTP] = React.useState("")


    const [cardData, setCardData] = React.useState({
        number: "",
        holder: "",
        expMonth: "",
        expYear: "",
        cvv: ""
    })

    const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = CardValidator.formatCardNumber(e.target.value)
        setCardData({ ...cardData, number: formatted })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!CardValidator.luhnCheck(cardData.number)) {
            toast({
                title: "Invalid Card",
                description: "Please check your card number.",
                variant: "destructive"
            })
            return
        }

        setIsLoading(true)
        try {
            const result = await apiRequest('/api/payment-methods', {
                method: 'POST',
                body: JSON.stringify({
                    card_number: cardData.number.replace(/\s/g, ''),
                    card_holder_name: cardData.holder,
                    card_exp_month: parseInt(cardData.expMonth),
                    card_exp_year: parseInt(cardData.expYear),
                    card_cvv: cardData.cvv
                })
            })

            // Store card data and show phone number modal

            setOpen(false)
            setShowPhoneModal(true)

        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            toast({
                title: "Error",
                description: error.message || "Failed to add card.",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleVerifyPhone = async () => {
        if (!phoneNumber || phoneNumber.length < 10) {
            toast({
                title: "Invalid Phone Number",
                description: "Please enter a valid phone number.",
                variant: "destructive"
            })
            return
        }

        setIsVerifyingPhone(true)

        // Simulate sending OTP
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Generate random 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        setGeneratedOTP(otp)

        // Show OTP in toast notification
        toast({
            title: `Your OTP: ${otp}`,
            description: `Code sent to ${phoneNumber}. Enter it below to verify.`,
        })

        setIsVerifyingPhone(false)
        setShowPhoneModal(false)
        setShowOTPModal(true)
    }

    const handleOTPVerified = () => {
        setShowOTPModal(false)

        toast({
            title: "Card Verified",
            description: "Your card has been added and verified with 2FA.",
        })

        setCardData({ number: "", holder: "", expMonth: "", expYear: "", cvv: "" })
        setPhoneNumber("")

        if (onSuccess) onSuccess()
    }

    const handleAddDemoCard = async () => {
        setIsLoading(true)
        try {
            const result = await apiRequest('/api/payment-methods', {
                method: 'POST',
                body: JSON.stringify({
                    card_number: "4242424242424242",
                    card_holder_name: "Demo User",
                    card_exp_month: "12",
                    card_exp_year: (new Date().getFullYear() + 2).toString(),
                    card_cvv: "424",
                    billing_address: {
                        line1: "123 Test St",
                        city: "San Francisco",
                        state: "CA",
                        postal_code: "94105",
                        country: "US"
                    }
                })
            })

            console.log('[DEBUG] API returned result:', result)
            // Store card data and show phone number modal

            setOpen(false)
            console.log('[DEBUG] About to show phone modal')
            setShowPhoneModal(true)
            console.log('[DEBUG] Phone modal state set to true')

        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    {trigger || (
                        <Button variant="outline" size="sm" className="gap-2">
                            <Plus size={14} /> Add Card
                        </Button>
                    )}
                </DialogTrigger>
                <DialogContent className="sm:max-w-md rounded-[2rem] bg-zinc-950 border-white/5">
                    <DialogHeader>
                        <DialogTitle className="text-2xl tracking-tighter text-white">Add New Card</DialogTitle>
                        <DialogDescription className="text-zinc-500 font-light pt-1">
                            Enter details to enable secure agentic transactions.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-5 pt-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 px-1">Card Number</label>
                            <Input
                                placeholder="0000 0000 0000 0000"
                                className="h-12 bg-zinc-900/50 border-white/5 focus-visible:ring-white/10 rounded-xl font-mono tracking-wider"
                                value={cardData.number}
                                onChange={handleCardNumberChange}
                                maxLength={23}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 px-1">Expiry</label>
                                <Input placeholder="MM" className="h-12 bg-zinc-900/50 border-white/5 focus-visible:ring-white/10 rounded-xl text-center" value={cardData.expMonth} onChange={e => setCardData({ ...cardData, expMonth: e.target.value })} maxLength={2} required />
                            </div>
                            <div className="space-y-2 pt-[18px]">
                                <Input placeholder="YYYY" className="h-12 bg-zinc-900/50 border-white/5 focus-visible:ring-white/10 rounded-xl text-center" value={cardData.expYear} onChange={e => setCardData({ ...cardData, expYear: e.target.value })} maxLength={4} required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 px-1">CVV</label>
                                <Input placeholder="123" className="h-12 bg-zinc-900/50 border-white/5 focus-visible:ring-white/10 rounded-xl text-center" value={cardData.cvv} onChange={e => setCardData({ ...cardData, cvv: e.target.value })} maxLength={4} required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 px-1">Cardholder Name</label>
                            <Input placeholder="John Doe" className="h-12 bg-zinc-900/50 border-white/5 focus-visible:ring-white/10 rounded-xl" value={cardData.holder} onChange={e => setCardData({ ...cardData, holder: e.target.value })} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                            <Button type="submit" className="h-11 rounded-xl bg-white text-black hover:bg-zinc-100" disabled={isLoading}>
                                {isLoading ? <Spinner className="animate-spin" /> : "Add Real Card"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="h-11 rounded-xl border-white/10 hover:bg-white/5 text-zinc-400"
                                onClick={handleAddDemoCard}
                                disabled={isLoading}
                            >
                                {isLoading ? <Spinner className="animate-spin" /> : "Try Demo Card"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Phone Number Verification Modal */}
            <Dialog open={showPhoneModal} onOpenChange={setShowPhoneModal}>
                <DialogContent className="sm:max-w-md rounded-[2rem] bg-zinc-950 border-white/5">
                    <DialogHeader>
                        <DialogTitle className="text-2xl tracking-tighter text-white">Verify Phone Number</DialogTitle>
                        <DialogDescription className="text-zinc-500 font-light pt-1">
                            Enter your phone number to receive an OTP for card verification.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-5 pt-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 px-1">Phone Number</label>
                            <Input
                                type="tel"
                                placeholder="+1 (555) 123-4567"
                                className="h-12 bg-zinc-900/50 border-white/5 focus-visible:ring-white/10 rounded-xl font-mono tracking-wider"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                            />
                        </div>
                        <Button
                            type="button"
                            onClick={handleVerifyPhone}
                            disabled={isVerifyingPhone || !phoneNumber}
                            className="w-full h-12 bg-white text-black rounded-xl font-medium tracking-tight hover:bg-zinc-200"
                        >
                            {isVerifyingPhone ? <Spinner className="animate-spin mr-2" /> : null}
                            {isVerifyingPhone ? "Sending OTP..." : "Verify Phone Number"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <OTPVerificationModal
                open={showOTPModal}
                onOpenChange={setShowOTPModal}
                onVerified={handleOTPVerified}
                generatedOTP={generatedOTP}
            />
        </>
    )
}
