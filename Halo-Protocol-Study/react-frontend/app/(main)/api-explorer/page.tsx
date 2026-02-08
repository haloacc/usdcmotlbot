"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { apiRequest } from "@/lib/api"
import { Terminal, PaperPlaneRight, Code, Trash } from "@phosphor-icons/react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useOrchestrator } from "@/hooks/use-orchestrator"
import { ProtocolLogViewer } from "@/components/protocol-log-viewer"

const CATALOG = [
    {
        category: "Orchestration & AI",
        items: [
            {
                label: "Agentic Checkout (Direct)",
                method: "POST",
                path: "/halo/agentic-checkout",
                payload: {
                    prompt: "Buy 1x Gaming Laptop for 1500 dollars",
                    merchantProtocol: "acp",
                    delegatedPayment: {
                        stripe_payment_method_id: "pm_card_visa",
                        card_brand: "visa",
                        card_last4: "4242",
                        card_exp_month: 12,
                        card_exp_year: 2025
                    }
                }
            },
            {
                label: "Natural Language Mapper",
                method: "POST",
                path: "/halo/process-natural-language",
                payload: {
                    prompt: "Buy a pair of headphones",
                    merchantProtocol: "acp"
                }
            },
            {
                label: "Protocol Orchestrate",
                method: "POST",
                path: "/halo/orchestrate",
                payload: {
                    request: {
                        line_items: [{
                            item: { id: "prod_1", name: "Gaming Laptop", price: { amount: 1000, currency: "USD" } },
                            quantity: 1
                        }],
                        intent: { action: "checkout" }
                    },
                    merchantProtocol: "acp"
                }
            }
        ]
    },
    {
        category: "ACP (Cross-Protocol)",
        items: [
            {
                label: "Create ACP Session",
                method: "POST",
                path: "/api/acp/checkout",
                payload: {
                    items: [{ id: "prod_1", quantity: 1 }],
                    currency: "usd"
                }
            },
            {
                label: "Get Session Details",
                method: "GET",
                path: "/api/acp/checkout/{id}",
                payload: {}
            },
            {
                label: "Update Fulfillment",
                method: "PATCH",
                path: "/api/acp/checkout/{id}",
                payload: {
                    fulfillment_details: {
                        address: {
                            line1: "123 Agent Way",
                            city: "San Francisco",
                            state: "CA",
                            postal_code: "94107",
                            country: "US"
                        }
                    }
                }
            },
            {
                label: "Complete Payment",
                method: "POST",
                path: "/api/acp/checkout/{id}/complete",
                payload: {
                    payment_data: {
                        token: "tok_visa",
                        provider: "stripe"
                    }
                }
            },
            {
                label: "Verify Session",
                method: "POST",
                path: "/api/acp/checkout/{id}/verify",
                payload: {
                    method: "3ds"
                }
            }
        ]
    },
    {
        category: "Order Management",
        items: [
            {
                label: "List All Orders",
                method: "GET",
                path: "/api/orders",
                payload: {}
            },
            {
                label: "Get Order Details",
                method: "GET",
                path: "/api/orders/{id}",
                payload: {}
            },
            {
                label: "Ship Order",
                method: "POST",
                path: "/api/orders/{id}/ship",
                payload: {
                    carrier: "FedEx",
                    tracking_number: "FX123456789"
                }
            },
            {
                label: "Process Refund",
                method: "POST",
                path: "/api/orders/{id}/refund",
                payload: {
                    amount: 5000,
                    reason: "Customer request"
                }
            },
            {
                label: "Send Confirmation",
                method: "POST",
                path: "/api/orders/send-confirmation",
                payload: {
                    orderNumber: "ORD-123",
                    items: [{ name: "Demo Item", quantity: 1, price: 100 }],
                    total: 100,
                    email: "demo@example.com"
                }
            }
        ]
    },
    {
        category: "Web3 & x402",
        items: [
            {
                label: "Request Resource (402)",
                method: "GET",
                path: "/api/x402/resource/demo?price=100",
                payload: {}
            },
            {
                label: "Submit Crypto Payment",
                method: "POST",
                path: "/api/x402/pay",
                payload: {
                    transaction_hash: "0x...",
                    network: "base_sepolia"
                }
            }
        ]
    },
    {
        category: "System & Governance",
        items: [
            {
                label: "List Active Sessions",
                method: "GET",
                path: "/api/sessions",
                payload: {}
            },
            {
                label: "System Statistics",
                method: "GET",
                path: "/api/stats",
                payload: {}
            },
            {
                label: "Protocol Detection",
                method: "POST",
                path: "/halo/detect",
                payload: {
                    request: { items: [{ id: "prod_1", quantity: 1 }] }
                }
            },
            {
                label: "Fulfillment Options",
                method: "POST",
                path: "/api/fulfillment/options",
                payload: {
                    items: [{ id: "item1", name: "Test", quantity: 1 }],
                    total: 5000
                }
            },
            {
                label: "Get Product Catalog",
                method: "GET",
                path: "/merchant/catalog",
                payload: {}
            }
        ]
    },
    {
        category: "Authentication",
        items: [
            {
                label: "Login User",
                method: "POST",
                path: "/api/auth/login",
                payload: {
                    email: "demo@halofy.ai",
                    password: "password123"
                }
            },
            {
                label: "Signup User",
                method: "POST",
                path: "/api/auth/signup",
                payload: {
                    email: "newuser@example.com",
                    password: "password123",
                    firstName: "Test",
                    lastName: "User",
                    mobile: "+15550109999",
                    mobile_verified: true
                }
            },
            {
                label: "Get Profile",
                method: "GET",
                path: "/api/users/profile",
                payload: {}
            },
            {
                label: "List Payment Methods",
                method: "GET",
                path: "/api/payment-methods",
                payload: {}
            }
        ]
    }
]

export default function ApiExplorerPage() {
    const { debugLogs, addDebugLog, clearDebugLogs } = useOrchestrator()
    const [endpoint, setEndpoint] = React.useState("/halo/agentic-checkout")
    const [method, setMethod] = React.useState("POST")
    const [payload, setPayload] = React.useState('{\n  "prompt": "Buy a laptop for 1000 dollars",\n  "merchantProtocol": "acp"\n}')
    const [isLoading, setIsLoading] = React.useState(false)

    // Hydration check for Select component
    const [isMounted, setIsMounted] = React.useState(false)
    React.useEffect(() => {
        setIsMounted(true)
    }, [])

    const handleExecute = async () => {
        setIsLoading(true)
        const requestBody = method !== "GET" ? JSON.parse(payload) : undefined

        // Log Request
        addDebugLog('out', `${method} ${endpoint}`, requestBody)

        try {
            const data = await apiRequest(endpoint, {
                method,
                body: requestBody ? JSON.stringify(requestBody) : undefined
            })

            // Log Response
            addDebugLog('in', `${endpoint} Response`, data)

            // Protocol Tracing (matching script.js logic)
            if (data.agentProtocol && data.merchantProtocol) {
                addDebugLog('trace', 'Protocol Translation', {
                    agent: data.agentProtocol.toUpperCase(),
                    merchant: data.merchantProtocol.toUpperCase()
                })
            }

            if (data.risk_evaluation) {
                addDebugLog('trace', 'Halo Risk Evaluation', {
                    score: data.risk_evaluation.score,
                    decision: data.risk_evaluation.decision,
                    factors: data.risk_evaluation.factors
                })
            }

            if (data.payment_completed) {
                addDebugLog('trace', 'Payment Completed', {
                    order_number: data.order_number,
                    amount: data.payment?.amount_cents,
                    currency: data.payment?.currency
                })
            }

        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : String(err)
            addDebugLog('error', 'Request Failed', errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    const loadPreset = (item: typeof CATALOG[0]['items'][0]) => {
        setMethod(item.method)
        setEndpoint(item.path)
        setPayload(JSON.stringify(item.payload, null, 2))
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 max-w-[1600px] h-screen max-h-screen overflow-hidden flex flex-col gap-4">
            <div className="flex items-center justify-between shrink-0">
                <div className="flex flex-col gap-1">
                    <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                        <Terminal size={20} className="text-primary" />
                        Protocol API Explorer
                    </h1>
                    <p className="text-xs text-muted-foreground">Test Halo&apos;s cross-protocol endpoints and orchestration logic.</p>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
                {/* LEFT PANEL: Catalog & Request (40%) */}
                <div className="col-span-5 flex flex-col gap-4 min-h-0">
                    {/* Catalog */}
                    <Card className="flex-1 flex flex-col overflow-hidden bg-muted/5 border-dashed">
                        <CardHeader className="py-2 px-4 border-b shrink-0 bg-muted/20">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">API Catalog</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 overflow-y-auto flex-1 scrollbar-thin">
                            {CATALOG.map((cat, i) => (
                                <div key={i} className="border-b last:border-0">
                                    <div className="bg-background/80 px-4 py-1.5 text-[10px] font-bold uppercase text-primary/70 sticky top-0 backdrop-blur-sm z-10 border-b border-border/50">
                                        {cat.category}
                                    </div>
                                    <div className="flex flex-col">
                                        {cat.items.map((item, j) => (
                                            <button
                                                key={j}
                                                onClick={() => loadPreset(item)}
                                                className="flex items-center gap-3 px-4 py-2 hover:bg-primary/5 transition-colors text-left border-b border-border/20 last:border-0 group"
                                            >
                                                <Badge
                                                    variant={item.method === 'GET' ? 'secondary' : item.method === 'POST' ? 'default' : 'outline'}
                                                    className="text-[9px] h-4 px-1 rounded-sm w-10 justify-center shrink-0"
                                                >
                                                    {item.method}
                                                </Badge>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-xs font-medium truncate group-hover:text-primary transition-colors">{item.label}</span>
                                                    <span className="text-[9px] text-muted-foreground font-mono truncate">{item.path}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Request Config */}
                    <Card className="flex-shrink-0 flex flex-col max-h-[50%] overflow-hidden border-primary/20 shadow-sm">
                        <CardHeader className="py-2 px-4 border-b shrink-0 bg-muted/10">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Request Details</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4 overflow-y-auto">
                            <div className="flex gap-2">
                                {isMounted && (
                                    <Select value={method} onValueChange={setMethod}>
                                        <SelectTrigger className="w-[100px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="GET">GET</SelectItem>
                                            <SelectItem value="POST">POST</SelectItem>
                                            <SelectItem value="PUT">PUT</SelectItem>
                                            <SelectItem value="DELETE">DELETE</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                                <Input
                                    value={endpoint}
                                    onChange={(e) => setEndpoint(e.target.value)}
                                    placeholder="/api/v1/..."
                                    className="font-mono text-sm flex-1"
                                />
                            </div>

                            <div className="space-y-1.5 flex flex-col min-h-[120px]">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                                    <Code size={12} /> JSON Payload
                                </label>
                                <textarea
                                    className="flex-1 w-full p-3 font-mono text-xs rounded-md border bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                                    value={payload}
                                    onChange={(e) => setPayload(e.target.value)}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="py-2 px-4 border-t bg-muted/5 shrink-0">
                            <Button className="w-full gap-2" onClick={handleExecute} disabled={isLoading}>
                                {isLoading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <PaperPlaneRight size={16} />}
                                Execute Request
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                {/* RIGHT PANEL: Protocol Inspector (60%) */}
                <div className="col-span-7 flex flex-col h-full overflow-hidden">
                    <Card className="h-full flex flex-col border-primary/20 shadow-lg bg-[#0A0A0B]">
                        <CardHeader className="py-2 px-4 border-b shrink-0 flex-row items-center justify-between space-y-0 bg-muted/10">
                            <div className="flex items-center gap-2 text-primary">
                                <Terminal size={16} />
                                <CardTitle className="text-xs font-bold uppercase tracking-wider">Protocol Inspector (Live Stream)</CardTitle>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={clearDebugLogs}>
                                <Trash size={14} />
                            </Button>
                        </CardHeader>
                        <CardContent className="flex-1 p-0 overflow-hidden relative">
                            <ProtocolLogViewer
                                logs={debugLogs}
                                className="h-full p-4"
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
