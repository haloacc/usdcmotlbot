"use client"

import * as React from "react"

interface Toast {
    id: string
    title?: string
    description?: string
    variant?: "default" | "destructive"
}

const ToastContext = React.createContext<{
    toast: (t: Omit<Toast, "id">) => void
} | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = React.useState<Toast[]>([])

    const toast = (t: Omit<Toast, "id">) => {
        const id = Math.random().toString(36).substring(2, 9)
        setToasts(prev => [...prev, { ...t, id }])
        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id))
        }, 3000)
    }

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                {toasts.map(t => (
                    <div
                        key={t.id}
                        className={`pointer-events-auto rounded-lg border p-4 shadow-lg transition-all animate-in slide-in-from-right-10 ${t.variant === "destructive" ? "bg-destructive text-destructive-foreground border-destructive" : "bg-background text-foreground border-border"
                            }`}
                    >
                        {t.title && <div className="font-bold text-sm tracking-tight">{t.title}</div>}
                        {t.description && <div className="text-xs opacity-90">{t.description}</div>}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const context = React.useContext(ToastContext)
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider")
    }
    return context
}
