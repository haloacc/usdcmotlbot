"use client"

import * as React from "react"
import { ChatInput } from "@/components/chat/chat-input"
import { MessageBubble } from "@/components/chat/message-bubble"
import Image from "next/image"
import { Sparkle, CircleNotch, Plus } from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import { useChat } from "@/hooks/use-chat"
import { ChallengeModal, BlockModal } from "@/components/modals/risk-modals"
import { AgenticLoadingModal } from "@/components/chat/agentic-loading-modal"
import { BiometricVerificationModal } from "@/components/chat/biometric-verification-modal"

export default function ChatPage() {
    const {
        messages, sendMessage, isLoading, riskModal, setRiskModal, handleVerificationComplete,
        showAgenticLoading, handleAgenticLoadingComplete,
        showBiometricVerification, biometricMethod,
        handleBiometricVerified
    } = useChat()
    const messagesEndRef = React.useRef<HTMLDivElement>(null)

    const handleChallengeConfirm = (method: string) => {
        setRiskModal(null)
        handleVerificationComplete(method)
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    React.useEffect(() => {
        scrollToBottom()
    }, [messages])

    return (
        <div className="flex h-full flex-col">
            {/* Header handled by Layout or here if specific */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                <div className="mx-auto flex max-w-3xl flex-col gap-6">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
                            <div className="mb-8 relative">
                                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
                                <div className="relative rounded-full bg-gradient-to-br from-primary to-emerald-600 p-6 text-white shadow-2xl">
                                    <Sparkle size={64} weight="fill" />
                                </div>
                            </div>
                            <h2 className="text-4xl font-bold tracking-tight mb-4">Welcome to Halo</h2>
                            <p className="text-muted-foreground text-lg max-w-md mx-auto mb-10">
                                Your Agentic Commerce Orchestrator. Shop across protocols seamlessly with automated payments.
                            </p>

                            <div className="w-full mt-4">
                                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-6 text-center">Ready to use Recommendations</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-8 px-1">
                                    {[
                                        {
                                            id: 'laptop_001',
                                            name: 'Gaming Laptop Pro',
                                            description: 'Ultra-slim high-performance gaming laptop with an RTX 4080.',
                                            price: { amount: 1500, currency: 'USD' },
                                            images: ['https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&q=80&w=800'],
                                            prompt: "Buy a gaming laptop for 1500 dollars"
                                        },
                                        {
                                            id: 'headphones_001',
                                            name: 'Wireless Studio Edge',
                                            description: 'Professional-grade noise-canceling wireless headphones.',
                                            price: { amount: 299, currency: 'USD' },
                                            images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800'],
                                            prompt: "Order Wireless Headphones for 299 dollars"
                                        },
                                        {
                                            id: 'watch_001',
                                            name: 'Smart Watch Horizon',
                                            description: 'Advanced fitness and health tracking smartwatch.',
                                            price: { amount: 399, currency: 'USD' },
                                            images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800'],
                                            prompt: "Buy a smart watch for 399 dollars"
                                        }
                                    ].map((p, i) => (
                                        <div
                                            key={i}
                                            onClick={() => sendMessage(p.prompt)}
                                            className="group cursor-pointer"
                                        >
                                            <div className="relative h-48 w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl transition-all group-hover:scale-[1.02] group-hover:border-primary/40 group-hover:shadow-primary/20">
                                                <Image
                                                    src={p.images[0]}
                                                    alt={p.name}
                                                    fill
                                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-5">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Recommended</span>
                                                        <Badge variant="secondary" className="h-5 text-[10px] bg-white/10 hover:bg-white/20 text-white border-none backdrop-blur-md">
                                                            FAST DELIVERY
                                                        </Badge>
                                                    </div>
                                                    <h4 className="text-base font-bold text-white leading-tight mb-2">{p.name}</h4>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-mono text-white/90 font-bold">${p.price.amount}</span>
                                                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30 transform transition-transform group-hover:scale-110 group-hover:rotate-90">
                                                            <Plus size={16} weight="bold" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <MessageBubble key={msg.id} message={msg} />
                        ))
                    )}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-3 text-sm text-foreground rounded-bl-sm">
                                <CircleNotch className="animate-spin" size={16} />
                                Thinking...
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <div className="border-t bg-background/50 p-4 backdrop-blur-sm">
                <div className="mx-auto max-w-3xl">
                    <ChatInput onSendMessage={sendMessage} disabled={isLoading} />
                    <p className="mt-2 text-center text-xs text-muted-foreground">
                        Halo can make mistakes. Please verify important information.
                    </p>
                </div>
            </div>

            {riskModal?.type === '3ds' && (
                <ChallengeModal
                    isOpen={true}
                    onOpenChange={(open) => !open && setRiskModal(null)}
                    type="3ds"
                    onConfirm={handleChallengeConfirm}
                />
            )}

            {riskModal?.type === 'block' && (
                <BlockModal
                    isOpen={true}
                    onOpenChange={(open) => !open && setRiskModal(null)}
                    reason={riskModal.data.reason}
                    factors={riskModal.data.factors}
                />
            )}

            <AgenticLoadingModal
                open={showAgenticLoading}
                onComplete={handleAgenticLoadingComplete}
            />

            {/* Biometric Verification Modal */}
            <BiometricVerificationModal
                open={showBiometricVerification}
                onVerified={handleBiometricVerified}
                method={biometricMethod}
            />


        </div >
    )
}
