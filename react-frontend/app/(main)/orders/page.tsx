"use client"

import * as React from "react"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { apiRequest } from "@/lib/api"
import { Package, Truck, CheckCircle, Receipt } from "@phosphor-icons/react"
interface Order {
    id: string;
    order_number: string;
    created_at: string;
    status: string;
    total: number;
    protocol?: string;
    payment_method?: string;
    items: Array<{
        name: string;
        quantity: number;
        price: number;
    }>;
}

export default function OrdersPage() {
    const [orders, setOrders] = React.useState<Order[]>([])
    const [isLoading, setIsLoading] = React.useState(true)

    React.useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await apiRequest('/api/orders')
                setOrders(res.orders || [])
            } catch (err) {
                console.error("Failed to fetch orders:", err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchOrders()
    }, [])

    return (
        <div className="container mx-auto p-6 sm:p-10">
            <div className="mb-8 flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
                <p className="text-muted-foreground">Track fulfillment across all commerce protocols.</p>
            </div>

            {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
            ) : orders.length === 0 ? (
                <Card className="flex h-64 flex-col items-center justify-center text-center opacity-60">
                    <Package size={48} className="mb-4 text-muted-foreground" />
                    <CardTitle>No Orders Found</CardTitle>
                    <CardDescription>Completed transactions will appear here.</CardDescription>
                </Card>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <Card key={order.id} className="overflow-hidden border-primary/10">
                            <div className="flex flex-col sm:flex-row">
                                <div className="flex-1 p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="rounded-full bg-primary/10 p-2 text-primary">
                                            <Receipt size={24} />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Order # {order.order_number}</div>
                                            <div className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}</div>
                                        </div>
                                        <Badge className="ml-auto" variant={order.status === 'completed' ? 'default' : 'secondary'}>
                                            {order.status?.toUpperCase() || 'PENDING'}
                                        </Badge>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <div className="text-xs font-bold uppercase text-muted-foreground mb-1">Items</div>
                                            <div className="text-sm">
                                                {order.items?.map((item, i) => (
                                                    <div key={i} className="flex justify-between">
                                                        <span>{item.quantity}x {item.name}</span>
                                                        <span className="font-medium">${(item.price * item.quantity / 100).toFixed(2)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-bold uppercase text-muted-foreground mb-1">Total Amount</div>
                                            <div className="text-2xl font-black text-primary">${((order.total || 0) / 100).toFixed(2)}</div>
                                            <div className="text-[10px] text-muted-foreground uppercase">{order.protocol} • {order.payment_method}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="w-full sm:w-64 bg-muted/30 p-6 border-t sm:border-t-0 sm:border-l">
                                    <div className="text-xs font-bold uppercase text-muted-foreground mb-4">Fulfillment Status</div>
                                    <div className="space-y-4">
                                        <div className="flex gap-3 items-start">
                                            <div className="mt-1 rounded-full bg-primary p-1 text-white">
                                                <CheckCircle size={10} weight="fill" />
                                            </div>
                                            <div className="text-xs">
                                                <div className="font-bold">Payment Confirmed</div>
                                                <div className="text-muted-foreground opacity-70">Orchestrated via Halo</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 items-start opacity-50">
                                            <div className="mt-1 rounded-full bg-muted-foreground p-1 text-white">
                                                <Truck size={10} weight="fill" />
                                            </div>
                                            <div className="text-xs">
                                                <div className="font-bold">In Transit</div>
                                                <div className="text-muted-foreground opacity-70">Est: Oct 12, 2026</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
