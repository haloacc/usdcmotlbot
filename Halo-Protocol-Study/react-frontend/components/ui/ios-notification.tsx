"use client"

import * as React from "react"
import { MessageSquare } from "lucide-react" // Or any other icon
import { cn } from "@/lib/utils"

interface IOSNotificationProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title?: string
    message: string
    appName?: string
    time?: string
}

export function IOSNotification({
    open,
    onOpenChange,
    title = "New Message",
    message,
    appName = "MESSAGES",
    time = "now"
}: IOSNotificationProps) {
    const [isVisible, setIsVisible] = React.useState(open)

    // Sync internal state with prop
    React.useEffect(() => {
        if (open) {
            setIsVisible(true)
            // Auto hide after 5 seconds
            const timer = setTimeout(() => {
                setIsVisible(false)
                onOpenChange(false)
            }, 5000)
            return () => clearTimeout(timer)
        } else {
            setIsVisible(false)
        }
    }, [open, onOpenChange])

    if (!open && !isVisible) return null

    return (
        <div
            className={cn(
                "fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-[360px]",
                "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                open ? "translate-y-0 opacity-100" : "-translate-y-8 opacity-0"
            )}
        >
            <div className="bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden cursor-pointer"
                onClick={() => {
                    setIsVisible(false)
                    onOpenChange(false)
                }}
            >
                <div className="p-3">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-[5px] bg-green-500 flex items-center justify-center">
                                <MessageSquare className="w-3 h-3 text-white fill-white" />
                            </div>
                            <span className="text-[10px] font-semibold tracking-wide text-zinc-900 dark:text-zinc-100 uppercase">{appName}</span>
                        </div>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400">{time}</span>
                    </div>

                    {/* Content */}
                    <div className="pl-0.5">
                        <h4 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 mb-0.5 leading-tight">{title}</h4>
                        <p className="text-[13px] text-zinc-700 dark:text-zinc-300 leading-tight">{message}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
