"use client"

import * as React from "react"
import { Truck, Package, CreditCard, Confetti, ChartBar } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

interface Event {
    id: string
    title: string
    description: string
    timestamp: string
    status: "completed" | "current" | "pending"
    code: string
}

interface FulfillmentTimelineProps {
    events: Event[]
    className?: string
}

export function FulfillmentTimeline({ events, className }: FulfillmentTimelineProps) {
    return (
        <div className={cn("py-4", className)}>
            <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary before:via-muted before:to-transparent">
                {events.map((event) => (
                    <div key={event.id} className="relative flex items-center justify-between gap-6 group">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "flex items-center justify-center w-10 h-10 rounded-full border shadow-sm transition-all duration-500",
                                event.status === "completed" ? "bg-primary border-primary text-white scale-110" :
                                    event.status === "current" ? "bg-background border-primary text-primary animate-pulse" :
                                        "bg-background border-muted text-muted-foreground"
                            )}>
                                {event.code === "PAYMENT" && <CreditCard size={18} weight={event.status === "completed" ? "fill" : "regular"} />}
                                {event.code === "PROCESSING" && <ChartBar size={18} weight={event.status === "completed" ? "fill" : "regular"} />}
                                {event.code === "SHIPPED" && <Truck size={18} weight={event.status === "completed" ? "fill" : "regular"} />}
                                {event.code === "DELIVERED" && <Package size={18} weight={event.status === "completed" ? "fill" : "regular"} />}
                            </div>
                            <div className="flex flex-col">
                                <span className={cn(
                                    "text-xs font-bold uppercase tracking-wider transition-colors",
                                    event.status === "pending" ? "text-muted-foreground" : "text-foreground"
                                )}>
                                    {event.title}
                                </span>
                                <span className="text-[10px] text-muted-foreground leading-tight">
                                    {event.description}
                                </span>
                            </div>
                        </div>
                        <div className="text-[9px] font-mono text-muted-foreground opacity-50 uppercase">
                            {event.timestamp}
                        </div>
                    </div>
                ))}
            </div>

            {events.every(e => e.status === "completed") && (
                <div className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/20 flex flex-col items-center text-center space-y-2 animate-in fade-in zoom-in-95 duration-700">
                    <Confetti size={32} className="text-primary" />
                    <h4 className="text-sm font-black uppercase italic tracking-tighter italic">Autonomous Cycle Complete</h4>
                    <p className="text-[10px] text-muted-foreground max-w-[200px]">
                        Order fulfilled via automated protocol orchestration without human intervention.
                    </p>
                </div>
            )}
        </div>
    )
}


