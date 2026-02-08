"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { apiRequest } from "@/lib/api"
import { Pulse, ShieldCheck, Tag } from "@phosphor-icons/react"

export default function SessionsPage() {
    const [sessions, setSessions] = React.useState<any[]>([]) // eslint-disable-line @typescript-eslint/no-explicit-any
    const [isLoading, setIsLoading] = React.useState(true)

    React.useEffect(() => {
        const fetchSessions = async () => {
            try {
                const res = await apiRequest('/api/sessions')
                setSessions(res.sessions || [])
            } catch (err) {
                console.error("Failed to fetch sessions:", err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchSessions()
    }, [])

    return (
        <div className="container mx-auto p-6 sm:p-10">
            <div className="mb-8 flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Active Sessions</h1>
                <p className="text-muted-foreground">Monitor real-time orchestrator sessions and protocol negotiation.</p>
            </div>

            {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
            ) : sessions.length === 0 ? (
                <Card className="flex h-64 flex-col items-center justify-center text-center opacity-60">
                    <Pulse size={48} className="mb-4 text-muted-foreground" />
                    <CardTitle>No Active Sessions</CardTitle>
                    <CardDescription>Start a checkout to see live orchestration logs.</CardDescription>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {sessions.map((session) => (
                        <Card key={session.id} className="overflow-hidden border-primary/10 bg-card/50">
                            <CardHeader className="bg-muted/30 pb-4">
                                <div className="flex items-center justify-between">
                                    <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
                                        {session.status?.toUpperCase() || 'ACTIVE'}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(session.created_at).toLocaleTimeString()}
                                    </span>
                                </div>
                                <CardTitle className="mt-2 text-base font-bold truncate">
                                    {session.metadata?.item || "Unnamed Session"}
                                </CardTitle>
                                <CardDescription className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest">
                                    <Tag size={12} /> {session.id}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] uppercase text-muted-foreground font-bold">Protocol</span>
                                        <div className="flex items-center gap-1 font-semibold">
                                            <span className="px-1 bg-primary/10 text-primary rounded leading-none py-0.5 uppercase">{session.agent_protocol}</span>
                                            <span className="opacity-50">→</span>
                                            <span className="px-1 bg-muted text-foreground rounded leading-none py-0.5 uppercase">{session.merchant_protocol}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1 text-right">
                                        <span className="text-[10px] uppercase text-muted-foreground font-bold">Total</span>
                                        <span className="text-lg font-bold">${((session.amount || 0) / 100).toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center gap-2 pt-4 border-t">
                                    <ShieldCheck size={16} className={session.risk_score < 30 ? "text-green-500" : "text-amber-500"} />
                                    <span className="text-[10px] font-bold">RISK SCORE: {session.risk_score}</span>
                                    <Badge variant="outline" className="ml-auto text-[10px] px-1 h-4">
                                        {session.mode}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
