"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Message } from "@/components/chat/message-bubble"
import { parseNaturalLanguageToUCP } from "@/lib/chat-utils"
import { apiRequest } from "@/lib/api"
import { useOrchestrator } from "@/hooks/use-orchestrator"

import { CheckoutCard, RiskBanner, SuccessBanner, ProductGallery, QuantityCard, OrderConfirmationCard, PaymentMethodSelectorCard, RiskAnalysis } from "@/components/chat/cards"
import { AddCardDialog } from "@/components/chat/add-card-dialog"
import { AgenticLoadingModal } from "@/components/chat/agentic-loading-modal"
import { Button } from "@/components/ui/button"
import { Plus } from "@phosphor-icons/react"

export type ChatState =
    | { type: 'idle' }
    | { type: 'awaiting_quantity', intent: any, originalText: string }
    | { type: 'awaiting_confirmation', intent: any, quantity: number }
    | { type: 'awaiting_payment_method', intent: any, quantity: number, paymentMethods: any[] }
    | { type: 'awaiting_verification', intent: any, quantity: number, method: any }

export function useChat() {
    const [messages, setMessages] = useState<Message[]>([])
    const [logs, setLogs] = useState<{ id: string, timestamp: number, level: 'info' | 'trace' | 'error' | 'success', message: string, details?: any }[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [chatState, setChatState] = useState<ChatState>({ type: 'idle' })
    const [riskModal, setRiskModal] = useState<{ type: '3ds' | 'block', data: any } | null>(null)
    const [showAgenticLoading, setShowAgenticLoading] = useState(false)
    const [pendingPaymentResult, setPendingPaymentResult] = useState<any>(null)
    const [showBiometricVerification, setShowBiometricVerification] = useState(false)
    const [biometricMethod, setBiometricMethod] = useState<'faceid' | 'touchid' | 'fingerprint'>('faceid')
    const [biometricVerified, setBiometricVerified] = useState(false) // Track if biometric auth completed
    const [pendingPaymentData, setPendingPaymentData] = useState<{ method: any, state: any } | null>(null)
    const { merchantProtocol, agenticMode, addDebugLog: orchestratorLog } = useOrchestrator()

    // Refs
    const chatStateRef = useRef(chatState)
    const protocolRef = useRef(merchantProtocol)
    const modeRef = useRef(agenticMode)

    useEffect(() => { chatStateRef.current = chatState }, [chatState])
    useEffect(() => { protocolRef.current = merchantProtocol }, [merchantProtocol])
    useEffect(() => { modeRef.current = agenticMode }, [agenticMode])

    const addLog = (level: 'info' | 'trace' | 'error' | 'success', message: string, details?: any) => {
        const newLog = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: Date.now(),
            level,
            message,
            details
        }
        setLogs(prev => [...prev, newLog])

        // Sync with global orchestrator for Protocol Inspector
        let type: "out" | "in" | "trace" | "error" = "trace"
        if (level === "info") type = "out"
        if (level === "success") type = "in"
        if (level === "error") type = "error"

        orchestratorLog(type, message, details)
    }

    const addMessage = (role: "user" | "bot", content: string | React.ReactNode) => {
        const newMsg: Message = {
            id: Math.random().toString(36).substr(2, 9),
            role,
            content,
            timestamp: Date.now()
        }
        setMessages(prev => [...prev, newMsg])
        return newMsg.id
    }

    const executeCheckout = async (intent: any, quantity: number, method: any, verified: boolean = false) => {
        const params = intent.intent.params as any
        const totalAmount = params.amount * quantity

        const checkoutEndpoint = modeRef.current ? '/halo/agentic-checkout' : '/halo/process-natural-language'
        const requestBody = {
            prompt: `Buy ${quantity} ${params.item} for ${totalAmount} dollars`,
            merchantProtocol: protocolRef.current,
            delegatedPayment: {
                stripe_payment_method_id: method.stripe_payment_method_id,
                card_brand: method.card_brand,
                card_last4: method.card_last4,
                card_exp_month: method.card_exp_month,
                card_exp_year: method.card_exp_year
            },
            verified // Pass verification status
        }

        addLog("info", `Initiating checkout via ${checkoutEndpoint}`, requestBody)
        const result = await apiRequest(checkoutEndpoint, {
            method: 'POST',
            body: JSON.stringify(requestBody)
        })
        addLog("trace", "Orchestrator Response Received", result)

        return result
    }

    const handleSelectQuantity = (quantity: number) => {
        const state = chatStateRef.current
        if (state.type !== 'awaiting_quantity') return
        const newIntent = { ...state.intent }
        newIntent.intent.params = { ...newIntent.intent.params, quantity }
        setChatState({ type: 'awaiting_confirmation', intent: newIntent, quantity })

        const params = newIntent.intent.params
        addMessage("bot", (
            <OrderConfirmationCard
                details={[
                    { label: "Item", value: params.item },
                    { label: "Quantity", value: `${quantity}x` },
                    { label: "Price", value: `$${params.amount}` },
                    { label: "Total", value: `$${params.amount * quantity}`, highlight: true }
                ]}
                onConfirm={() => handleConfirmOrder()}
                onCancel={() => handleCancelOrder()}
            />
        ))
    }

    const handleConfirmOrder = async () => {
        console.log("👉 handleConfirmOrder called")
        const state = chatStateRef.current
        console.log("👉 Current Chat State:", state)

        if (state.type !== 'awaiting_confirmation') {
            console.warn("⚠️ handleConfirmOrder aborted: state is not awaiting_confirmation", state.type)
            return
        }

        setIsLoading(true)
        console.log("👉 Fetching payment methods...")
        addLog("info", "Fetching available payment methods...")
        try {
            const pmRes = await apiRequest('/api/payment-methods')
            addLog("trace", "Payment Methods Loaded", { count: pmRes.payment_methods?.length })

            const methods = pmRes.payment_methods || []

            if (methods.length === 0) {
                addMessage("bot", (
                    <div className="flex flex-col gap-3">
                        <div className="text-sm">No payment methods found for your account.</div>
                        <AddCardDialog
                            onSuccess={() => handleConfirmOrder()}
                            trigger={
                                <Button className="w-fit h-9 gap-2 rounded-full px-5 bg-primary text-primary-foreground hover:opacity-90">
                                    <Plus size={16} weight="bold" /> Add First Payment Method
                                </Button>
                            }
                        />
                    </div>
                ))
            } else {
                setChatState({ type: 'awaiting_payment_method', intent: state.intent, quantity: state.quantity, paymentMethods: methods })
                addMessage("bot", (
                    <PaymentMethodSelectorCard
                        methods={methods}
                        onSelect={(method) => handleSelectPaymentMethod(method)}
                    />
                ))
            }
        } catch (error: any) {
            console.error("❌ handleConfirmOrder error:", error)
            // Check for authentication error
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                addMessage("bot", (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-amber-500 font-bold">
                            <span>🔐 Session Expired</span>
                        </div>
                        <div>Please <a href="/login.html" className="text-primary underline font-medium">login again</a> to complete your purchase.</div>
                    </div>
                ))
                setChatState({ type: 'idle' })
            } else {
                addMessage("bot", `Error fetching payment methods: ${error.message}`)
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancelOrder = () => {
        addMessage("bot", "Order cancelled. What else can I help you with?")
        setChatState({ type: 'idle' })
    }

    const handleSelectPaymentMethod = async (method: any) => {
        const state = chatStateRef.current
        if (state.type !== 'awaiting_payment_method') return

        // Check if this is a high-value transaction (>$100)
        const totalAmount = state.intent.intent.params.amount * state.quantity
        if (totalAmount > 100) {
            // For high-value transactions, show verification modal directly
            setPendingPaymentData({ method, state })
            setRiskModal({ type: '3ds', data: {} })
            setChatState({ type: 'awaiting_verification', method, intent: state.intent, quantity: state.quantity })
            return
        }

        // Proceed with normal payment flow
        setIsLoading(true)
        addMessage("bot", `Processing payment with your ${method.card_brand}...`)

        try {
            // Show agentic loading modal
            setShowAgenticLoading(true)

            const result = await executeCheckout(state.intent, state.quantity, method, false)

            // Store result and let loading modal complete
            setPendingPaymentResult(result)

            if (result.success && result.payment_completed) {
                // Success handling remains similar but simplified
                addMessage("bot", (
                    <div className="flex flex-col gap-3">
                        <SuccessBanner orderNumber={result.order_number || result.order_id || "7821"} />
                        <RiskAnalysis
                            score={result.risk_evaluation?.score || 12}
                            decision={result.risk_evaluation?.decision || "approve"}
                            factors={result.risk_evaluation?.factors || []}
                            protocol_flow={["UCP", "HALO", result.merchantProtocol?.toUpperCase() || "ACP"]}
                        />
                        <div className="flex gap-2 text-[10px] text-muted-foreground opacity-70">
                            <span>Protocol: {result.agentProtocol?.toUpperCase()} &rarr; {result.merchantProtocol?.toUpperCase()}</span>
                            <span>&bull;</span>
                            <span>Mode: {modeRef.current ? 'AGENTIC' : 'HYBRID'}</span>
                        </div>
                    </div>
                ))
                setChatState({ type: 'idle' })
            } else if (result.requires_verification || result.status === 'requires_action') {
                const totalAmount = state.intent.intent.params.amount * state.quantity
                setChatState({
                    type: 'awaiting_verification',
                    intent: state.intent,
                    quantity: state.quantity,
                    method: method
                })
                setRiskModal({ type: '3ds', data: result.action_data || { amount: totalAmount } })
                addMessage("bot", "\u26A0 Additional verification required (3DS/Biometric). Please complete the challenge.")
            } else if (result.status === 'blocked') {
                setRiskModal({ type: 'block', data: result.risk_evaluation || { reason: "Policy violation", factors: ["velocity"] } })
                addMessage("bot", "\u274C Transaction blocked by Halo Risk Engine.")
                setChatState({ type: 'idle' })
            } else {
                addMessage("bot", `\u274C Error: ${result.error || "Payment failed"}`)
                setChatState({ type: 'idle' })
            }
        } catch (error: any) {
            setShowAgenticLoading(false)
            addMessage("bot", `Payment error: ${error.message}`)
            setChatState({ type: 'idle' })
            setIsLoading(false)
        }
    }

    const handleAgenticLoadingComplete = () => {
        setShowAgenticLoading(false)
        const result = pendingPaymentResult
        const state = chatStateRef.current

        // Allow both awaiting_payment_method and awaiting_verification states
        if (!result || (state.type !== 'awaiting_payment_method' && state.type !== 'awaiting_verification')) {
            setIsLoading(false)
            return
        }

        if (result.success && result.payment_completed) {
            addMessage("bot", (
                <div className="flex flex-col gap-3">
                    <SuccessBanner orderNumber={result.order_number || result.order_id || "7821"} />
                    <RiskAnalysis
                        score={result.risk_evaluation?.score || 12}
                        decision={result.risk_evaluation?.decision || "approve"}
                        factors={result.risk_evaluation?.factors || []}
                        protocol_flow={["UCP", "HALO", result.merchantProtocol?.toUpperCase() || "ACP"]}
                    />
                    <div className="flex gap-2 text-[10px] text-muted-foreground opacity-70">
                        <span>Protocol: {result.agentProtocol?.toUpperCase()} &rarr; {result.merchantProtocol?.toUpperCase()}</span>
                        <span>&bull;</span>
                        <span>Mode: {modeRef.current ? 'AGENTIC' : 'HYBRID'}</span>
                    </div>
                </div>
            ))
            setChatState({ type: 'idle' })
            setRiskModal(null) // Clear the verification modal to prevent loop
            setBiometricVerified(false) // Reset biometric flag for next transaction
        } else if ((result.requires_verification || result.status === 'requires_action') && !biometricVerified) {
            // Only show verification modal if we haven't already completed biometric verification
            const totalAmount = state.intent.intent.params.amount * state.quantity
            setChatState({
                type: 'awaiting_verification',
                intent: state.intent,
                quantity: state.quantity,
                method: state.type === 'awaiting_payment_method' && state.paymentMethods?.[0] ? state.paymentMethods[0] : null
            })
            setRiskModal({ type: '3ds', data: result.action_data || { amount: totalAmount } })
            addMessage("bot", "⚠ Additional verification required (3DS/Biometric). Please complete the challenge.")
        } else if (result.status === 'blocked') {
            setBiometricVerified(false) // Reset for blocked transactions
            setRiskModal({ type: 'block', data: result.risk_evaluation || { reason: "Policy violation", factors: ["velocity"] } })
            addMessage("bot", "❌ Transaction blocked by Halo Risk Engine.")
            setChatState({ type: 'idle' })
        } else {
            addMessage("bot", `❌ Error: ${result.error || "Payment failed"}`)
            setChatState({ type: 'idle' })
        }

        setPendingPaymentResult(null)
        setIsLoading(false)
    }

    const handleBiometricVerified = async () => {
        setShowBiometricVerification(false)
        setRiskModal(null) // Clear verification modal immediately to prevent loop
        setBiometricVerified(true) // Mark that biometric verification is complete

        if (!pendingPaymentData) return

        const { method, state } = pendingPaymentData

        // Now proceed with payment
        setIsLoading(true)
        addMessage("bot", `✓ Biometric verified. Processing payment with your ${method.card_brand}...`)

        try {
            // Show agentic loading modal
            setShowAgenticLoading(true)

            const result = await executeCheckout(state.intent, state.quantity, method, true)

            // Store result and let loading modal complete
            setPendingPaymentResult(result)

        } catch (error: any) {
            setShowAgenticLoading(false)
            addMessage("bot", `Payment error: ${error.message}`)
            setChatState({ type: 'idle' })
            setIsLoading(false)
            setPendingPaymentData(null)
        }
        // Don't clear pendingPaymentData here - let handleAgenticLoadingComplete do it
    }

    const handleVerificationComplete = async (method?: string) => {
        const state = chatStateRef.current
        if (state.type !== 'awaiting_verification') {
            console.warn("Verification completed but state is not awaiting_verification:", state.type)
            return
        }

        // If method is 'faceid' or 'touchid', show the biometric verification modal
        if (method === 'faceid' || method === 'touchid') {
            setBiometricMethod(method)
            setShowBiometricVerification(true)
            setRiskModal(null)
            // Store the payment data for after biometric verification
            setPendingPaymentData({ method: state.method, state })
            return
        }

        // For 3DS or other methods, proceed with payment
        setIsLoading(true)
        setRiskModal(null)
        addMessage("bot", "Verification successful. Finalizing order...")

        try {
            const result = await executeCheckout(state.intent, state.quantity, state.method, true)

            if (result.success && result.payment_completed) {
                addMessage("bot", (
                    <div className="flex flex-col gap-3">
                        <SuccessBanner orderNumber={result.order_number || result.order_id || "7821"} />
                        <RiskAnalysis
                            score={result.risk_evaluation?.score || 12}
                            decision={result.risk_evaluation?.decision || "approve"}
                            factors={result.risk_evaluation?.factors || []}
                            protocol_flow={["UCP", "HALO", result.merchantProtocol?.toUpperCase() || "ACP"]}
                        />
                    </div>
                ))
            } else {
                addMessage("bot", `\u274C Error after verification: ${result.error || "Payment failed"}`)
            }
        } catch (error: any) {
            addMessage("bot", `Payment error: ${error.message}`)
        } finally {
            setChatState({ type: 'idle' })
            setIsLoading(false)
        }
    }

    const sendMessage = async (text: string) => {
        addMessage("user", text)
        setIsLoading(true)

        try {
            const state = chatStateRef.current
            // Handle State Machine
            if (state.type === 'awaiting_quantity') {
                const quantity = parseInt(text)
                if (isNaN(quantity) || quantity < 1 || quantity > 99) {
                    addMessage("bot", "Please enter a valid quantity (1-99)")
                    setIsLoading(false)
                    return
                }

                const newIntent = { ...state.intent }
                newIntent.intent.params = { ...newIntent.intent.params, quantity }
                setChatState({ type: 'awaiting_confirmation', intent: newIntent, quantity })

                const params = newIntent.intent.params
                addMessage("bot", (
                    <OrderConfirmationCard
                        details={[
                            { label: "Item", value: params.item },
                            { label: "Quantity", value: `${quantity}x` },
                            { label: "Price", value: `$${params.amount}` },
                            { label: "Total", value: `$${params.amount * quantity}`, highlight: true }
                        ]}
                        onConfirm={() => handleConfirmOrder()}
                        onCancel={() => handleCancelOrder()}
                    />
                ))
                setIsLoading(false)
                return
            }

            if (state.type === 'awaiting_confirmation') {
                const response = text.toLowerCase().trim()
                if (['yes', 'y', 'confirm', 'ok'].includes(response)) {
                    // Fetch Payment Methods
                    addLog("info", "User confirmed order. Fetching payment methods...")
                    const pmRes = await apiRequest('/api/payment-methods')
                    addLog("trace", "Payment Methods Loaded", pmRes)

                    const methods = pmRes.payment_methods || []

                    if (methods.length === 0) {
                        addMessage("bot", (
                            <div className="flex flex-col gap-3">
                                <div className="text-sm">No payment methods found for your account.</div>
                                <AddCardDialog
                                    onSuccess={() => handleConfirmOrder()}
                                    trigger={
                                        <Button className="w-fit h-9 gap-2 rounded-full px-5 bg-primary text-primary-foreground hover:opacity-90">
                                            <Plus size={16} weight="bold" /> Add First Payment Method
                                        </Button>
                                    }
                                />
                            </div>
                        ))
                    } else {
                        setChatState({ type: 'awaiting_payment_method', intent: state.intent, quantity: state.quantity, paymentMethods: methods })
                        addMessage("bot", (
                            <PaymentMethodSelectorCard
                                methods={methods}
                                onSelect={(method) => handleSelectPaymentMethod(method)}
                            />
                        ))
                    }
                } else {
                    addMessage("bot", "Order cancelled. What else can I help you with?")
                    setChatState({ type: 'idle' })
                }
                setIsLoading(false)
                return
            }

            if (state.type === 'awaiting_payment_method') {
                const selection = parseInt(text)
                if (!isNaN(selection) && selection >= 1 && selection <= state.paymentMethods.length) {
                    handleSelectPaymentMethod(state.paymentMethods[selection - 1])
                    setIsLoading(false)
                    return
                }

                addMessage("bot", "Invalid selection. Please choose a method from the card below.")
                setIsLoading(false)
                return
            }

            if (text.toLowerCase().includes("browse") || text.toLowerCase().includes("what can i buy") || text.toLowerCase().includes("products") || text.toLowerCase().includes("show me items")) {
                addLog("info", "User requested product catalog (Discovery Mode)")
                const catalog = await apiRequest('/merchant/catalog')
                addLog("trace", "Catalog Received", { itemCount: catalog.products?.length })

                addMessage("bot", (
                    <div className="flex flex-col gap-3 w-full">
                        <div>Here are some products available at CyberShop:</div>
                        <ProductGallery
                            products={catalog.products}
                            onSelect={(p) => sendMessage(`Buy ${p.name} for ${p.price.amount} dollars`)}
                        />
                    </div>
                ))
                setIsLoading(false)
                return
            }

            // Default: Initial Parse
            addLog("info", `Intercepting natural language input: "${text}"`)
            const intent = parseNaturalLanguageToUCP(text)
            addLog("trace", "Neural UCP Mapper parsed intent", intent)

            if (!intent) {
                addMessage("bot", "I can help you buy items using any commerce protocol. Try saying 'Buy a gaming chair for 200 dollars'.")
                setIsLoading(false)
                return
            }

            // Check quantity - default to 1 if not specified
            const quantityMatch = text.match(/(\d+)\s*(?:x|units?|pieces?|items?|quantities?)/i)
            const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
            (intent.intent.params as any).quantity = quantity;
            setChatState({ type: 'awaiting_confirmation', intent, quantity });

            addMessage("bot", (
                <OrderConfirmationCard
                    details={[
                        { label: "Item", value: intent.intent.params.item },
                        { label: "Quantity", value: `${quantity}x` },
                        { label: "Price", value: `$${intent.intent.params.amount}` },
                        { label: "Total", value: `$${intent.intent.params.amount * quantity}`, highlight: true }
                    ]}
                    onConfirm={() => handleConfirmOrder()}
                    onCancel={() => handleCancelOrder()}
                />
            ))

        } catch (error: any) {
            console.error("Chat Error:", error)
            addLog("error", "Chat Execution Failed", { error: error.message })
            addMessage("bot", `Sorry, I encountered an error: ${error.message}`)
        } finally {
            setIsLoading(false)
        }
    }

    return {
        messages,
        setMessages,
        sendMessage,
        isLoading,
        chatState,
        riskModal,
        setRiskModal,
        handleVerificationComplete,
        logs, // Export logs
        showAgenticLoading,
        handleAgenticLoadingComplete,
        showBiometricVerification,
        biometricMethod,
        handleBiometricVerified
    }
}
