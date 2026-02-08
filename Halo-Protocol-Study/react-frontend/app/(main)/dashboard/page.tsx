"use client"

import { useEffect, useState } from "react"
import { apiRequest, getToken } from "@/lib/api"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, CreditCard, CurrencyBtc, Trash, CheckCircle, Spinner, CircleNotch } from "@phosphor-icons/react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { IOSNotification } from "@/components/ui/ios-notification"
import { CardValidator } from "@/lib/validators"

interface User {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    mobile?: string;
    mobile_verified?: boolean;
}

interface PaymentMethod {
    id: string;
    card_number: string;
    card_last4: string;
    card_exp_month: number;
    card_exp_year: number;
    verified: boolean;
}

interface CryptoWallet {
    id: string;
    address: string;
    chain_id: string;
    network_name: string;
}

export default function DashboardPage() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
    const [cryptoWallets, setCryptoWallets] = useState<CryptoWallet[]>([])

    // Add Card State
    const [addCardOpen, setAddCardOpen] = useState(false)
    const [cardData, setCardData] = useState({
        number: "",
        holder: "",
        expMonth: "",
        expYear: "",
        cvv: ""
    })
    const [addingCard, setAddingCard] = useState(false)

    // Mobile Verification State
    const [mobileVerifyOpen, setMobileVerifyOpen] = useState(false)
    const [verifyingUser, setVerifyingUser] = useState(false)

    // OTP / Verification State
    const [verifyModalOpen, setVerifyModalOpen] = useState(false)
    const [verifyingId, setVerifyingId] = useState<string | null>(null)
    const [otp, setOtp] = useState("")
    const [verifying, setVerifying] = useState(false)

    // Phone Number + OTP Flow for Demo Card
    const [showPhoneModal, setShowPhoneModal] = useState(false)
    const [phoneNumber, setPhoneNumber] = useState("")
    const [isVerifyingPhone, setIsVerifyingPhone] = useState(false)
    const [showOTPModal, setShowOTPModal] = useState(false)
    const [generatedOTP, setGeneratedOTP] = useState("")
    const [showNotification, setShowNotification] = useState(false)


    useEffect(() => {
        const token = getToken()
        if (!token) {
            router.push('/auth/login')
            return
        }

        loadData()
    }, [router])

    const loadData = async () => {
        try {
            const [userRes, pmRes, walletRes] = await Promise.all([
                apiRequest('/api/auth/me'),
                apiRequest('/api/payment-methods'),
                apiRequest('/api/crypto-wallets')
            ])

            setUser(userRes.user)
            setPaymentMethods(pmRes.payment_methods || [])
            setCryptoWallets(walletRes.wallets || [])
        } finally {
            setLoading(false)
        }
    }

    const handleAddCard = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validation (simplified)
        if (!CardValidator.luhnCheck(cardData.number)) {
            alert("Invalid card number")
            return
        }

        setAddingCard(true)
        try {
            const res = await apiRequest('/api/payment-methods', {
                method: 'POST',
                body: JSON.stringify({
                    card_number: cardData.number.replace(/\s/g, ''),
                    card_holder_name: cardData.holder,
                    card_exp_month: parseInt(cardData.expMonth),
                    card_exp_year: parseInt(cardData.expYear),
                    card_cvv: cardData.cvv
                })
            })
            setAddCardOpen(false)
            setCardData({ number: "", holder: "", expMonth: "", expYear: "", cvv: "" })

            if (res.payment_method?.id) {
                setVerifyingId(res.payment_method.id)
                setVerifyModalOpen(true)
            } else {
                loadData()
                alert("Card added successfully")
            }
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            if (error.status === 403 && error.requires_mobile_verification) {
                setAddCardOpen(false)
                setMobileVerifyOpen(true)
            } else {
                alert(error.message)
            }
        } finally {
            setAddingCard(false)
        }
    }

    const handleAddDemoCard = async () => {
        setAddingCard(true)
        try {
            const demoCard = {
                card_number: "4242424242424242",
                card_holder_name: user?.first_name + " " + user?.last_name,
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
            }
            const result = await apiRequest('/api/payment-methods', {
                method: 'POST',
                body: JSON.stringify(demoCard)
            })
            // Store result and show phone number modal

            setAddCardOpen(false)
            setShowPhoneModal(true)
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            alert(error.message)
        } finally {
            setAddingCard(false)
        }
    }

    const handleVerifyPhone = async () => {
        if (!phoneNumber || phoneNumber.length < 10) {
            alert("Please enter a valid phone number")
            return
        }

        setIsVerifyingPhone(true)
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Generate OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
        setGeneratedOTP(otpCode)

        // Don't use alert - let the modal display the OTP
        // The OTP will be shown via iOS-style notification

        setIsVerifyingPhone(false)
        setShowPhoneModal(false)
        setShowOTPModal(true)

        // Trigger generic iOS notification
        setTimeout(() => setShowNotification(true), 500)
    }

    const handleOTPVerify = () => {
        if (otp !== generatedOTP) {
            alert("Invalid OTP. Please try again.")
            return
        }

        setShowOTPModal(false)
        setOtp("")
        setPhoneNumber("")

        loadData()
        alert("Card added and verified with 2FA!")
    }

    const handleConnectWallet = async () => {
        const connectSimulated = async () => {
            if (confirm("Do you want to use a simulated wallet for demo purposes?")) {
                const demoAddress = "0x" + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join("")
                const res = await apiRequest('/api/crypto-wallets', {
                    method: 'POST',
                    body: JSON.stringify({
                        address: demoAddress,
                        wallet_type: 'simulated',
                        chain_id: '0x1',
                        network_name: 'Ethereum Mainnet'
                    })
                })
                setCryptoWallets(prev => [...prev, res.wallet || { id: 'demo_' + Date.now(), address: demoAddress, chain_id: '0x1', network_name: 'Ethereum Mainnet' }])
            }
        }

        try {
            // Check for window.ethereum
            const ethereum = (window as unknown as { ethereum: any }).ethereum // eslint-disable-line @typescript-eslint/no-explicit-any

            if (ethereum) {
                try {
                    const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
                    if (accounts.length > 0) {
                        const address = accounts[0]
                        const chainId = await ethereum.request({ method: 'eth_chainId' })

                        // Map common chain IDs to names or use default
                        const networks: Record<string, string> = {
                            '0x1': 'Ethereum Mainnet',
                            '0x5': 'Goerli Testnet',
                            '0xaa36a7': 'Sepolia Testnet',
                            '0x89': 'Polygon Mainnet',
                            '0x13881': 'Polygon Mumbai',
                            '0xa4b1': 'Arbitrum One',
                            '0x2105': 'Base Mainnet',
                            '0x14a34': 'Base Sepolia'
                        }
                        const networkName = networks[chainId] || 'Unknown Network'

                        // Save to backend
                        const res = await apiRequest('/api/crypto-wallets', {
                            method: 'POST',
                            body: JSON.stringify({
                                address,
                                wallet_type: 'metamask',
                                chain_id: chainId,
                                network_name: networkName
                            })
                        })
                        setCryptoWallets(prev => [...prev, res.wallet])
                        alert(`Connected wallet: ${address.slice(0, 6)}...${address.slice(-4)}`)
                    }
                } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
                    console.error("Wallet connect error:", err)
                    const msg = err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err)) || "Unknown error"

                    // Ignore 4001 (User rejected request)
                    if (err?.code === 4001 || msg.includes("rejected")) {
                        return
                    }

                    if (confirm(`Failed to connect wallet: ${msg}\n\nDo you want to retry with a simulated wallet?`)) {
                        await connectSimulated()
                    }
                }
            } else {
                // Simulation for demo parity if no wallet ext installed
                if (confirm("No crypto wallet detected. Simulate connection for demo?")) {
                    await connectSimulated()
                }
            }
        } catch (globalErr: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            console.error("Critical wallet error", globalErr)
            alert("An unexpected error occurred: " + globalErr.message)
        }
    }

    const handleVerifyMobile = async (e: React.FormEvent) => {
        e.preventDefault()
        setVerifyingUser(true)
        try {
            if (!user) return
            await apiRequest('/api/auth/verify-mobile', {
                method: 'POST',
                body: JSON.stringify({ user_id: user.id, otp })
            })
            setMobileVerifyOpen(false)
            setOtp("")
            loadData()
            alert("Mobile verified! You can now add your card.")
            setAddCardOpen(true) // Re-open add card dialog
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            alert(error.message)
        } finally {
            setVerifyingUser(false)
        }
    }

    const handleVerifyCard = async (e: React.FormEvent) => {
        e.preventDefault()
        setVerifying(true)
        try {
            await apiRequest(`/api/payment-methods/${verifyingId}/verify`, {
                method: 'POST',
                body: JSON.stringify({ otp })
            })
            setVerifyModalOpen(false)
            setOtp("")
            loadData()
            alert("Card verified and ready for use")
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            alert(error.message)
        } finally {
            setVerifying(false)
        }
    }

    const handleRemoveCard = async (id: string) => {
        if (!confirm("Remove this card?")) return
        try {
            await apiRequest(`/api/payment-methods/${id}`, { method: 'DELETE' })
            loadData()
        } catch (error) {
            console.error(error)
        }
    }

    // Formatting card input
    const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = CardValidator.formatCardNumber(e.target.value)
        setCardData({ ...cardData, number: formatted })
    }

    if (loading) return <div className="flex h-full items-center justify-center"><Spinner size={40} className="animate-spin" /></div>

    return (
        <div className="p-8 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2">
                <div className="flex items-center gap-6">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-tr from-white/20 to-transparent rounded-full blur opacity-25 group-hover:opacity-40 transition" />
                        <div className="relative w-16 h-16 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-white font-medium text-2xl overflow-hidden shadow-2xl">
                            {user?.first_name?.[0]}{user?.last_name?.[0]}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-3xl font-medium tracking-tight text-white">{user?.first_name} {user?.last_name}</h1>
                        <p className="text-zinc-500 font-light tracking-wide">{user?.email}</p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    className="h-10 px-6 rounded-full border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white transition-all font-light"
                    onClick={() => alert("Edit Profile coming soon.")}
                >
                    Edit Profile
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Active Cards", value: paymentMethods.length, icon: CreditCard, color: "text-blue-400" },
                    { label: "Active Sessions", value: 0, icon: CircleNotch, color: "text-emerald-400" },
                    { label: "Completed Orders", value: 0, icon: CheckCircle, color: "text-zinc-500" }
                ].map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <div key={i} className="relative group overflow-hidden rounded-3xl border border-white/5 bg-zinc-900/40 p-6 transition-all hover:border-white/10 hover:bg-zinc-900/60">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-medium tracking-wider text-zinc-500 uppercase">{stat.label}</span>
                                <Icon size={20} className={stat.color} />
                            </div>
                            <div className="text-4xl font-medium tracking-tight text-white">{stat.value}</div>
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                        </div>
                    );
                })}
            </div>

            {/* Payment Methods */}
            <div className="space-y-6">
                <div className="flex justify-between items-end px-2">
                    <div className="space-y-1">
                        <h2 className="text-xl font-medium flex items-center gap-2 text-white">
                            <CreditCard size={24} className="text-zinc-400" /> Payment Methods
                        </h2>
                        <p className="text-xs text-zinc-500 font-light">Manage your primary funding sources for autonomous agent payments</p>
                    </div>
                    <Dialog open={addCardOpen} onOpenChange={setAddCardOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-9 gap-2 rounded-full px-5 bg-white text-black hover:bg-zinc-200 border-none transition-all shadow-lg hover:shadow-white/5">
                                <Plus size={16} weight="bold" /> Add Card
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md rounded-[2rem] bg-zinc-950 border-white/5">
                            <DialogHeader>
                                <DialogTitle className="text-2xl tracking-tighter text-white">Add New Card</DialogTitle>
                                <DialogDescription className="text-zinc-500 font-light pt-1">
                                    Enter details to enable secure agentic transactions.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleAddCard} className="space-y-5 pt-8">
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
                                    <Button type="submit" className="h-11 rounded-xl bg-white text-black hover:bg-zinc-100" disabled={addingCard}>
                                        {addingCard ? <Spinner className="animate-spin" /> : "Add Real Card"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-11 rounded-xl border-white/10 hover:bg-white/5 text-zinc-400"
                                        onClick={handleAddDemoCard}
                                        disabled={addingCard}
                                    >
                                        {addingCard ? <Spinner className="animate-spin" /> : "Try Demo Card"}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid gap-4">
                    {paymentMethods.length === 0 ? (
                        <div className="relative group overflow-hidden rounded-[2.5rem] border-2 border-dashed border-white/5 bg-zinc-950/20 py-20 transition-all hover:border-white/10">
                            <div className="flex flex-col items-center justify-center text-center px-4">
                                <div className="w-16 h-16 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-xl shadow-black/50">
                                    <CreditCard size={32} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                                </div>
                                <h3 className="text-lg font-medium text-white mb-2">Secure your first card</h3>
                                <p className="text-zinc-500 font-light max-w-xs text-sm leading-relaxed">
                                    Connect a funding source to enable AI agents to negotiate and settle payments on your behalf.
                                </p>
                            </div>
                        </div>
                    ) : (
                        paymentMethods.map(pm => {
                            const brand = CardValidator.detectBrand(pm.card_number || "4111"); // Basic fallback or need real helper
                            return (
                                <div key={pm.id} className="group relative flex flex-row items-center justify-between p-6 rounded-[2rem] border border-white/5 bg-zinc-900/30 transition-all hover:border-white/10 hover:bg-zinc-900/50 shadow-sm">
                                    <div className="flex items-center gap-6">
                                        <div className="h-10 w-16 rounded-lg flex items-center justify-center text-white font-medium text-[10px] tracking-widest shadow-lg overflow-hidden relative" style={{ background: brand.color }}>
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                                            {brand.name}
                                        </div>
                                        <div>
                                            <p className="text-lg font-medium text-white tracking-tight">•••• {pm.card_last4}</p>
                                            <p className="text-xs text-zinc-500 font-light tracking-wide mt-0.5">
                                                Expires {pm.card_exp_month}/{pm.card_exp_year} •
                                                {pm.verified
                                                    ? <span className="ml-1.5 text-emerald-400/80 font-medium">Verified</span>
                                                    : <span className="ml-1.5 text-amber-400/80 font-medium">Verification Pending</span>
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 rounded-full text-zinc-600 hover:text-red-400 hover:bg-red-400/5 border border-transparent hover:border-red-400/20 transition-all"
                                        onClick={() => handleRemoveCard(pm.id)}
                                    >
                                        <Trash size={18} />
                                    </Button>
                                    <div className="absolute left-0 right-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Crypto Wallets */}
            <div className="space-y-6 pt-4">
                <div className="flex justify-between items-end px-2">
                    <div className="space-y-1">
                        <h2 className="text-xl font-medium flex items-center gap-2 text-white">
                            <CurrencyBtc size={24} className="text-zinc-400" /> Web3 Accounts
                        </h2>
                        <p className="text-xs text-zinc-500 font-light">Connect decentralized wallets for x402 and protocol-based transactions</p>
                    </div>
                    <Button
                        variant="outline"
                        className="h-9 gap-2 rounded-full px-5 border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white transition-all font-light"
                        onClick={handleConnectWallet}
                    >
                        <Plus size={16} weight="bold" /> Connect Wallet
                    </Button>
                </div>

                <div className="grid gap-4">
                    {cryptoWallets.length === 0 ? (
                        <div className="relative group overflow-hidden rounded-[2.5rem] border-2 border-dashed border-white/5 bg-zinc-950/20 py-20 transition-all hover:border-white/10">
                            <div className="flex flex-col items-center justify-center text-center px-4">
                                <div className="w-16 h-16 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-xl shadow-black/50">
                                    <CurrencyBtc size={32} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                                </div>
                                <h3 className="text-lg font-medium text-white mb-2">Connect a wallet</h3>
                                <p className="text-zinc-500 font-light max-w-xs text-sm leading-relaxed">
                                    Bridge your on-chain assets to the Halo ecosystem for autonomous protocol negotiation.
                                </p>
                            </div>
                        </div>
                    ) : (
                        cryptoWallets.map(w => (
                            <div key={w.id} className="group relative flex flex-row items-center justify-between p-6 rounded-[2rem] border border-white/5 bg-zinc-900/30 transition-all hover:border-white/10 hover:bg-zinc-900/50">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 shadow-inner">
                                        <CurrencyBtc size={20} />
                                    </div>
                                    <p className="text-sm font-light text-zinc-300 font-mono tracking-tight">{w.address}</p>
                                </div>
                                <div className="absolute left-0 right-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* UPI Section */}
            <div className="space-y-6 pt-4 opacity-40 grayscale select-none">
                <div className="flex justify-between items-end px-2">
                    <div className="space-y-1">
                        <h2 className="text-xl font-medium flex items-center gap-2 text-white">
                            <span>🇮🇳</span> Digital Wallets
                        </h2>
                        <p className="text-xs text-zinc-500 font-light">Global payment rail integration for local currencies</p>
                    </div>
                    <div className="bg-amber-500/20 text-amber-500 text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-amber-500/20">Coming Soon</div>
                </div>
                <div className="relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-zinc-950/20 p-12 text-center">
                    <p className="text-zinc-400 font-light text-sm">🚀 UPI, Google Pay, and PhonePe integration in progress</p>
                </div>
            </div>

            {/* Mobile Verification Modal */}
            <Dialog open={mobileVerifyOpen} onOpenChange={setMobileVerifyOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Verify Your Phone Number</DialogTitle>
                        <DialogDescription>
                            A verification code has been sent to your registered mobile number.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleVerifyMobile} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-center block">
                                Enter the 6-digit code sent to your mobile (+1 ••• ••• {user?.mobile?.slice(-4)})
                            </label>
                            <Input
                                placeholder="000000"
                                value={otp}
                                onChange={e => setOtp(e.target.value)}
                                maxLength={6}
                                className="text-center text-2xl tracking-widest font-mono"
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={verifyingUser}>
                            {verifyingUser ? <CircleNotch className="animate-spin" size={20} /> : "Verify Mobile"}
                        </Button>
                        <p className="text-center text-xs text-muted-foreground">
                            Required to enable autonomous agent payments.
                        </p>
                    </form>
                </DialogContent>
            </Dialog>

            {/* OTP Verification Modal */}
            <Dialog open={verifyModalOpen} onOpenChange={setVerifyModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Verify Your Card</DialogTitle>
                        <DialogDescription>
                            Enter the OTP sent by your bank to verify this card.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleVerifyCard} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-center block">
                                Enter the 6-digit code sent to your mobile
                            </label>
                            <Input
                                placeholder="000000"
                                value={otp}
                                onChange={e => setOtp(e.target.value)}
                                maxLength={6}
                                className="text-center text-2xl tracking-widest font-mono"
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={verifying}>
                            {verifying ? <CircleNotch className="animate-spin" size={20} /> : "Verify Card"}
                        </Button>
                        <p className="text-center text-xs text-muted-foreground">
                            This security step is required by legal and bank protocols for autonomous payments.
                        </p>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Phone Number Verification Modal for Demo Card */}
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

            {/* OTP Verification Modal for Demo Card */}
            <Dialog open={showOTPModal} onOpenChange={setShowOTPModal}>
                <DialogContent className="sm:max-w-md rounded-[2rem] bg-zinc-950 border-white/5">
                    <DialogHeader>
                        <DialogTitle className="text-2xl tracking-tighter text-white">Enter OTP</DialogTitle>
                        <DialogDescription className="text-zinc-500 font-light pt-1">
                            Enter the 6-digit code sent to your phone to verify your card.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-5 pt-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 px-1">OTP Code</label>
                            <Input
                                type="password"
                                placeholder="• • • • • •"
                                className="h-12 bg-zinc-900/50 border-white/5 focus-visible:ring-white/10 rounded-xl text-center text-2xl tracking-[0.5em] font-mono"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                maxLength={6}
                            />
                        </div>
                        <Button
                            type="button"
                            onClick={handleOTPVerify}
                            disabled={otp.length !== 6}
                            className="w-full h-12 bg-white text-black rounded-xl font-medium tracking-tight hover:bg-zinc-200"
                        >
                            Verify
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <IOSNotification
                open={showNotification}
                onOpenChange={setShowNotification}
                title="Halo Verification"
                appName="MESSAGES"
                time="now"
                message={`Your Halo verification code is: ${generatedOTP}`}
            />
        </div>
    )
}
