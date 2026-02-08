"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ShieldCheck, ShieldWarning, ShieldSlash, ArrowRight, ChartBar, Cpu } from "@phosphor-icons/react"

interface RiskFactor {
    key: string
    label: string
    impact: "high" | "medium" | "low"
    description: string
}

interface RiskAnalysisProps {
    score: number
    decision: "approve" | "challenge" | "block"
    factors: string[]
    protocol_flow: string[] // e.g. ["UCP", "HALO", "ACP"]
    className?: string
}

const FACTOR_MAP: Record<string, RiskFactor> = {
    "international": { key: "international", label: "International Transaction", impact: "high", description: "Cross-border payment detected. Verified via IP and shipping address." },
    "high_value": { key: "high_value", label: "High Value Order", impact: "medium", description: "Transaction amount exceeds standard behavior threshold." },
    "express_shipping": { key: "express_shipping", label: "Express Shipping", impact: "low", description: "Urgent fulfillment request often associated with specific risk profiles." },
    "new_device": { key: "new_device", label: "New Device Signature", impact: "medium", description: "Device fingerprint not previously associated with this account." },
    "velocity": { key: "velocity", label: "Velocity Spike", impact: "high", description: "Multiple transaction attempts in a very short window." }
}

export function RiskAnalysis({ score, decision, factors, protocol_flow, className }: RiskAnalysisProps) {
    const isSafe = score < 30
    const isWarning = score >= 30 && score < 60

    const DecisionIcon = decision === "approve" ? ShieldCheck : decision === "challenge" ? ShieldWarning : ShieldSlash
    const decisionColor = decision === "approve" ? "text-green-500" : decision === "challenge" ? "text-yellow-500" : "text-red-500"
    const bgGradient = decision === "approve" ? "from-green-500/10 to-transparent" : decision === "challenge" ? "from-yellow-500/10 to-transparent" : "from-red-500/10 to-transparent"

    return (
        <Card className={cn("overflow-hidden border-primary/10 bg-muted/30 shadow-2xl", className)}>
            <CardHeader className={cn("py-4 border-b border-primary/5 bg-gradient-to-r", bgGradient)}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ChartBar className="text-primary animate-pulse" size={20} />
                        <CardTitle className="text-sm font-bold tracking-tight uppercase">Halo Deep Risk Engine</CardTitle>
                    </div>
                    <Badge variant="outline" className={cn("font-mono text-[10px] border-primary/20 bg-primary/5", decisionColor)}>
                        SECURED BY HALO v3
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                {/* Score & Gauge */}
                <div className="flex items-center justify-between gap-8">
                    <div className="relative h-24 w-24 flex items-center justify-center">
                        <svg className="h-full w-full transform -rotate-90">
                            <circle
                                cx="48"
                                cy="48"
                                r="40"
                                fill="transparent"
                                stroke="currentColor"
                                strokeWidth="8"
                                className="text-muted/20"
                            />
                            <circle
                                cx="48"
                                cy="48"
                                r="40"
                                fill="transparent"
                                stroke="currentColor"
                                strokeWidth="8"
                                strokeDasharray={251.2}
                                strokeDashoffset={251.2 - (251.2 * score) / 100}
                                className={cn("transition-all duration-1000 ease-out", isSafe ? "text-green-500" : isWarning ? "text-yellow-500" : "text-red-500")}
                            />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                            <span className="text-2xl font-black">{score}</span>
                            <span className="text-[8px] uppercase font-bold opacity-50">Score</span>
                        </div>
                    </div>

                    <div className="flex-1 space-y-1">
                        <div className={cn("flex items-center gap-2 text-xl font-bold uppercase tracking-tighter", decisionColor)}>
                            <DecisionIcon size={24} weight="fill" />
                            {decision}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            {decision === "approve" && "Transaction cleared. Secure token generated for merchant handoff."}
                            {decision === "challenge" && "Step-up verification required. Triggering 3DS/Biometric challenge."}
                            {decision === "block" && "Security protocol lock engaged. Fraud signals exceed regulatory safety thresholds."}
                        </p>
                    </div>
                </div>

                {/* Protocol Pipe visualization */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
                        <Cpu size={14} /> Protocol Orchestration Pipe
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-primary/5 font-mono text-[10px]">
                        {protocol_flow.map((node, i) => (
                            <React.Fragment key={`${node}-${i}`}>
                                <div className={cn("px-2 py-1 rounded bg-primary/10 border border-primary/20", i === 1 && "bg-primary/20 text-primary border-primary/40 font-bold shadow-[0_0_15px_rgba(var(--primary),0.3)]")}>
                                    {node}
                                </div>
                                {i < protocol_flow.length - 1 && (
                                    <ArrowRight className="text-muted-foreground opacity-50 animate-in fade-in slide-in-from-left-2 duration-500" />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Risk Factors */}
                <div className="space-y-3">
                    <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Triggered Risk Signals</div>
                    <div className="grid gap-2">
                        {(() => {
                            const factorsList = Array.isArray(factors)
                                ? factors
                                : (typeof factors === 'object' && factors !== null ? Object.keys(factors) : []);

                            if (factorsList.length === 0) {
                                return (
                                    <div className="text-center py-4 text-[10px] border border-dashed rounded-lg text-muted-foreground border-primary/10">
                                        NO CRITICAL SIGNALS DETECTED
                                    </div>
                                );
                            }

                            return factorsList.map(f => {
                                const factor = FACTOR_MAP[f] || { label: f, impact: "medium", description: "Standard signal analysis." }
                                return (
                                    <div key={f} className="flex gap-3 p-3 rounded-lg bg-muted/50 border border-primary/5 hover:border-primary/10 transition-colors">
                                        <div className={cn("w-1 h-full rounded-full", factor.impact === "high" ? "bg-red-500" : factor.impact === "medium" ? "bg-yellow-500" : "bg-green-500")} />
                                        <div className="space-y-1">
                                            <div className="text-xs font-bold">{factor.label}</div>
                                            <div className="text-[10px] text-muted-foreground line-clamp-2">{factor.description}</div>
                                        </div>
                                    </div>
                                )
                            });
                        })()}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
