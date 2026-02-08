"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export type LogType = "in" | "out" | "trace" | "error"

export interface ProtocolLog {
    id: string
    type: LogType
    title: string
    content: unknown
    timestamp: Date
}

interface ProtocolLogViewerProps {
    logs: ProtocolLog[]
    className?: string
}

export function ProtocolLogViewer({ logs, className }: ProtocolLogViewerProps) {
    const bottomRef = React.useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom when new logs arrive
    React.useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [logs])

    if (logs.length === 0) {
        return (
            <div className={cn("flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground", className)}>
                <div className="text-xs font-mono uppercase tracking-widest opacity-50">No protocol events detected</div>
            </div>
        )
    }

    return (
        <div className={cn("flex flex-col overflow-y-auto font-mono text-[10px]", className)}>
            {logs.map((log) => (
                <div key={log.id} className="mb-2 rounded border bg-muted/30 p-2 last:mb-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="mb-1 flex items-center justify-between border-b border-border/50 pb-1">
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "rounded px-1 text-[9px] font-bold uppercase",
                                log.type === "in" ? "bg-green-500/20 text-green-500" :
                                    log.type === "out" ? "bg-blue-500/20 text-blue-500" :
                                        log.type === "trace" ? "bg-purple-500/20 text-purple-500" :
                                            "bg-destructive/20 text-destructive"
                            )}>
                                {log.type}
                            </span>
                            <span className="font-bold text-foreground/80">{log.title}</span>
                        </div>
                        <span className="opacity-50 text-[9px]">{log.timestamp.toLocaleTimeString()}</span>
                    </div>
                    <pre className="mt-1 max-h-60 overflow-auto whitespace-pre-wrap text-muted-foreground custom-scrollbar">
                        {typeof log.content === 'string'
                            ? log.content
                            : JSON.stringify(log.content, null, 2)}
                    </pre>
                </div>
            ))}
            <div ref={bottomRef} />
        </div>
    )
}
