"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    ChatCircleText,
    SquaresFour,
    ClockCounterClockwise,
    Gear,
    SignOut,
    TerminalWindow,
    TrendUp
} from "@phosphor-icons/react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { apiRequest, clearToken } from "@/lib/api"
import { useOrchestrator, Protocol } from "@/hooks/use-orchestrator"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const { merchantProtocol, setMerchantProtocol, agenticMode, setAgenticMode } = useOrchestrator()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    const navItems = [
        {
            title: "Checkout",
            href: "/",
            icon: ChatCircleText,
        },
        {
            title: "Sessions",
            href: "/sessions",
            icon: TrendUp,
        },
        {
            title: "Orders",
            href: "/orders",
            icon: ClockCounterClockwise,
        },
        {
            title: "API Explorer",
            href: "/api-explorer",
            icon: TerminalWindow,
        },
        {
            title: "Dashboard",
            href: "/dashboard",
            icon: SquaresFour,
        },
        {
            title: "Settings",
            href: "/settings",
            icon: Gear,
        },
    ]

    const handleSignOut = async () => {
        try {
            await apiRequest('/api/auth/logout', { method: 'POST' })
        } catch (error) {
            console.error('Logout error:', error)
        } finally {
            clearToken()
            router.push('/auth/login')
        }
    }

    return (
        <aside className="hidden h-screen w-64 flex-col border-r bg-card/50 backdrop-blur-xl md:flex">
            <div className="flex h-16 items-center border-b px-6">
                <div className="flex items-center gap-2 font-bold text-lg">
                    <div className="flex items-center gap-2 font-bold text-lg relative h-6 w-20">
                        <Image
                            src="/halo-logo.png"
                            alt="Halo"
                            fill
                            className="object-contain brightness-0 invert opacity-90 hover:opacity-100 transition-opacity"
                            onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement;
                                target.style.display = 'none';
                                target.parentElement!.innerHTML = '<span class="text-xl font-black tracking-tighter">HALO</span>';
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto py-2">
                <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                    {navItems.map((item, index) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href

                        return (
                            <Link
                                key={index}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                                    isActive
                                        ? "bg-muted text-primary"
                                        : "text-muted-foreground hover:bg-muted/50"
                                )}
                            >
                                <Icon size={20} weight={isActive ? "fill" : "regular"} />
                                {item.title}
                            </Link>
                        )
                    })}
                </nav>

                <div className="mt-6 px-6">
                    <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Configuration</h4>

                    <div className="mb-4 space-y-2">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Merchant Protocol</label>
                        {mounted ? (
                            <Select value={merchantProtocol} onValueChange={(val: Protocol) => setMerchantProtocol(val)}>
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Select Protocol" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="acp">ACP (Agentic Commerce)</SelectItem>
                                    <SelectItem value="ucp">UCP (Universal Commerce)</SelectItem>
                                    <SelectItem value="x402">x402 (HTTP 402)</SelectItem>
                                </SelectContent>
                            </Select>
                        ) : (
                            <div className="h-8 w-full rounded-md border bg-muted/50 animate-pulse" />
                        )}
                    </div>

                    <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                        <div className="grid gap-0.5">
                            <span className="text-xs font-bold">Agentic Mode</span>
                            <span className="text-[10px] text-muted-foreground leading-tight">Agent pays via delegated credentials</span>
                        </div>
                        <Switch
                            checked={agenticMode}
                            onCheckedChange={setAgenticMode}
                        />
                    </div>
                </div>
            </div>

            <div className="mt-auto border-t p-4">
                <div className="mb-4 flex flex-wrap gap-1 px-2">
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">ACP v2026</span>
                    <span className="rounded bg-gray-500/10 px-1.5 py-0.5 text-[9px] font-bold text-gray-400">UCP v1.0</span>
                    <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-500">x402</span>
                </div>
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
                    onClick={handleSignOut}
                >
                    <SignOut size={20} />
                    Sign Out
                </Button>
            </div>
        </aside>
    )
}
