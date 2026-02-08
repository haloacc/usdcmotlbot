"use client"

import * as React from "react"
import { useOrchestrator } from "@/hooks/use-orchestrator"
import { ProtocolLogViewer } from "@/components/protocol-log-viewer"
import { Terminal, Trash, CaretUp, CaretDown } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ProtocolInspectorProps {
    mode?: "fixed" | "embedded"
    className?: string
}

export function ProtocolInspector({ mode = "fixed", className }: ProtocolInspectorProps) {
    const { debugLogs, clearDebugLogs } = useOrchestrator()
    const [isExpanded, setIsExpanded] = React.useState(true)

    // For embedded mode, we might want to show empty state or handle it differently
    if (debugLogs.length === 0 && mode === "fixed") return null

    if (mode === "embedded") {
        return (
            <div className={cn("flex flex-col h-full bg-[#0A0A0B] border-l border-white/10 overflow-hidden", className)}>
                <div className="flex h-10 items-center justify-between border-b border-white/10 px-4 bg-white/5 shrink-0">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                        <Terminal size={14} />
                        Protocol Inspector
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-white/5"
                        onClick={clearDebugLogs}
                        title="Clear logs"
                    >
                        <Trash size={14} />
                    </Button>
                </div>
                <div className="flex-1 overflow-hidden relative bg-black/40">
                    <ProtocolLogViewer
                        logs={debugLogs}
                        className="h-full p-4"
                    />
                </div>
            </div>
        )
    }

    // Default Fixed Mode
    return (
        <aside
            className={cn(
                "fixed bottom-0 right-0 z-40 border-l border-t bg-card/95 backdrop-blur-xl transition-all duration-300 shadow-2xl",
                isExpanded ? "h-96 w-[450px]" : "h-10 w-[450px]",
                className
            )}
        >
            <div className="flex h-10 items-center justify-between border-b px-4 bg-muted/20">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <Terminal size={14} />
                    Protocol Inspector
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                        onClick={clearDebugLogs}
                        title="Clear logs"
                    >
                        <Trash size={14} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? <CaretDown size={14} /> : <CaretUp size={14} />}
                    </Button>
                </div>
            </div>

            {isExpanded && (
                <div className="h-[calc(100%-2.5rem)] bg-background/50">
                    <ProtocolLogViewer
                        logs={debugLogs}
                        className="h-full p-2"
                    />
                </div>
            )}
        </aside>
    )
}
