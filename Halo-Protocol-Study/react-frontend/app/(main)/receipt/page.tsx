"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { apiRequest } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Printer, ShoppingBag, ArrowLeft } from "@phosphor-icons/react"
import Link from "next/link"

function ReceiptContent() {
    const searchParams = useSearchParams()
    const sessionId = searchParams.get('session_id')
    const haloSession = searchParams.get('halo_session')

    const [order, setOrder] = React.useState<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
    const [user, setUser] = React.useState<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
    const [isLoading, setIsLoading] = React.useState(true)

    React.useEffect(() => {
        const loadOrderData = async () => {
            try {
                // Get user info
                const userRes = await apiRequest('/api/auth/me')
                setUser(userRes.user)

                // Get order info (mocking based on legacy logic)
                const cartStr = localStorage.getItem('halo_cart_backup') || localStorage.getItem('halo_cart') || '[]'
                const cart = JSON.parse(cartStr)

                const subtotal = cart.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) // eslint-disable-line @typescript-eslint/no-explicit-any
                const shipping = 25
                const tax = subtotal * 0.08
                const total = subtotal + shipping + tax

                setOrder({
                    orderNumber: `ORD-${Date.now().toString().slice(-8)}`,
                    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                    items: cart,
                    subtotal,
                    shipping,
                    tax,
                    total,
                    status: 'Completed'
                })

                // Clear cart if successful
                localStorage.removeItem('halo_cart')
                localStorage.removeItem('halo_cart_backup')
            } catch (error) {
                console.error("Failed to load receipt data:", error)
            } finally {
                setIsLoading(false)
            }
        }

        loadOrderData()
    }, [])

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">Loading receipt...</p>
            </div>
        )
    }

    if (!order) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-4">
                <h2 className="text-xl font-bold text-destructive text-balance">Order Not Found</h2>
                <Button asChild variant="outline">
                    <Link href="/">Back to Chat</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="container mx-auto max-w-2xl p-6">
            <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-green-500">
                    <CheckCircle size={40} weight="fill" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">Payment Successful!</h1>
                <p className="text-muted-foreground">Thank you for your order. A confirmation has been sent to {user?.email}.</p>
            </div>

            <Card className="overflow-hidden">
                <CardHeader className="border-b bg-muted/30 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Order {order.orderNumber}</CardTitle>
                            <p className="text-sm text-muted-foreground">{order.date}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</p>
                            <p className="text-sm font-bold text-green-500">{order.status}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="divide-y p-0">
                    <div className="p-6">
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Billing Details</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="font-medium">{user?.full_name}</p>
                                <p className="text-muted-foreground">{user?.email}</p>
                            </div>
                            <div className="text-right text-xs opacity-70">
                                <p>Session: {haloSession?.slice(0, 15)}...</p>
                                <p>Stripe: {sessionId?.slice(0, 15)}...</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Items</h3>
                        <table className="w-full text-sm">
                            <tbody>
                                {order.items.map((item: any, i: number) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                                    <tr key={i} className="border-b border-transparent hover:bg-muted/30">
                                        <td className="py-2">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">{item.emoji}</span>
                                                <span className="font-medium">{item.name}</span>
                                                <span className="text-muted-foreground">x{item.quantity}</span>
                                            </div>
                                        </td>
                                        <td className="py-2 text-right">${(item.price * item.quantity).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-muted/10 p-6">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>${order.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Shipping</span>
                                <span>${order.shipping.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Tax</span>
                                <span>${order.tax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between border-t pt-2 text-lg font-bold">
                                <span>Total Paid</span>
                                <span className="text-green-500">${order.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button variant="outline" className="flex-1 gap-2" onClick={() => window.print()}>
                    <Printer size={18} />
                    Print Receipt
                </Button>
                <Button asChild className="flex-1 gap-2">
                    <Link href="/">
                        <ShoppingBag size={18} />
                        Continue Chatting
                    </Link>
                </Button>
            </div>

            <div className="mt-6 text-center">
                <Button variant="ghost" asChild className="text-xs gap-2">
                    <Link href="/">
                        <ArrowLeft size={14} />
                        Back to Chat
                    </Link>
                </Button>
            </div>
        </div>
    )
}

export default function ReceiptPage() {
    return (
        <React.Suspense fallback={
            <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">Loading session...</p>
            </div>
        }>
            <ReceiptContent />
        </React.Suspense>
    )
}
