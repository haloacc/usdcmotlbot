"use client"

import * as React from "react"

export type Protocol = "acp" | "ucp" | "x402"

interface DebugLog {
    id: string
    type: "in" | "out" | "trace" | "error"
    title: string
    content: any
    timestamp: Date
}

interface OrchestratorContextType {
    merchantProtocol: Protocol
    setMerchantProtocol: (protocol: Protocol) => void
    agenticMode: boolean
    setAgenticMode: (mode: boolean) => void
    debugLogs: DebugLog[]
    addDebugLog: (type: DebugLog["type"], title: string, content: any) => void
    clearDebugLogs: () => void
}

const OrchestratorContext = React.createContext<OrchestratorContextType | undefined>(undefined)

export function OrchestratorProvider({ children }: { children: React.ReactNode }) {
    const [merchantProtocol, setMerchantProtocol] = React.useState<Protocol>("acp")
    const [agenticMode, setAgenticMode] = React.useState(true)
    const [debugLogs, setDebugLogs] = React.useState<DebugLog[]>([])

    const addDebugLog = (type: DebugLog["type"], title: string, content: any) => {
        const id = Math.random().toString(36).substring(2, 9)
        setDebugLogs(prev => [
            { id, type, title, content, timestamp: new Date() },
            ...prev
        ].slice(0, 100)) // Keep last 100 logs
    }

    const clearDebugLogs = () => setDebugLogs([])

    return (
        <OrchestratorContext.Provider
            value={{
                merchantProtocol,
                setMerchantProtocol,
                agenticMode,
                setAgenticMode,
                debugLogs,
                addDebugLog,
                clearDebugLogs,
            }}
        >
            {children}
        </OrchestratorContext.Provider>
    )
}

export function useOrchestrator() {
    const context = React.useContext(OrchestratorContext)
    if (context === undefined) {
        throw new Error("useOrchestrator must be used within an OrchestratorProvider")
    }
    return context
}
