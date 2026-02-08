"use client"

import * as React from "react"

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CheckCircle, ShieldCheck, CreditCard, Plus } from "@phosphor-icons/react"
import Image from "next/image"
// import { RiskAnalysis } from "./risk-analysis"

// import { FulfillmentTimeline } from "../orders/fulfillment-timeline"
import Link from "next/link"
import { AddCardDialog } from "./add-card-dialog"

interface CheckoutCardProps {
    title: string
    details: { label: string; value: string | number; highlight?: boolean }[]
    status?: "pending" | "success" | "error" | "blocked"
    icon?: React.ReactNode
}

export function CheckoutCard({ title, details, status = "pending", icon }: CheckoutCardProps) {
    const statusColors = {
        pending: "border-primary/50 bg-primary/5",
        success: "border-green-500/50 bg-green-500/5",
        error: "border-destructive/50 bg-destructive/5",
        blocked: "border-red-600 bg-red-600/10",
    }

    return (
        <Card className={cn("w-full max-w-sm overflow-hidden", statusColors[status])}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    {icon || <CreditCard size={18} />}
                    {title}
                </CardTitle>
                <Badge variant={status === "success" ? "default" : "outline"} className="uppercase text-[10px]">
                    {status}
                </Badge>
            </CardHeader>
            <CardContent className="grid gap-2 py-3">
                {details.map((detail, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{detail.label}</span>
                        <strong className={cn(detail.highlight && "text-primary font-bold")}>
                            {detail.value}
                        </strong>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}

export function RiskBanner({ score, decision }: { score: number; decision: string }) {
    const isSafe = score < 30
    const isWarning = score >= 30 && score < 60

    return (
        <div className={cn(
            "rounded-lg p-3 text-xs flex flex-col gap-1 border",
            isSafe ? "bg-green-500/10 border-green-500/20" : isWarning ? "bg-yellow-500/10 border-yellow-500/20" : "bg-red-500/10 border-red-500/20"
        )}>
            <div className="flex items-center gap-2 font-bold">
                <ShieldCheck size={16} />
                Halo Risk Evaluation
            </div>
            <div className="flex justify-between items-center mt-1">
                <span>Score: {score}/100</span>
                <span className="uppercase font-mono">{decision}</span>
            </div>
            <div className="w-full h-1 bg-muted/20 rounded-full mt-1 overflow-hidden">
                <div
                    className={cn("h-full", isSafe ? "bg-green-500" : isWarning ? "bg-yellow-500" : "bg-red-500")}
                    style={{ width: `${score}%` }}
                />
            </div>
        </div>
    )
}

interface ProductGalleryProps {
    products: any[] // eslint-disable-line @typescript-eslint/no-explicit-any
    onSelect: (product: any) => void // eslint-disable-line @typescript-eslint/no-explicit-any
}

export function ProductGallery({ products, onSelect }: ProductGalleryProps) {
    return (
        <div className="flex w-full gap-5 overflow-x-auto pb-6 scrollbar-hide snap-x px-1">
            {products.map((p, i) => (
                <Card
                    key={i}
                    className="min-w-[280px] max-w-[280px] flex-shrink-0 snap-center overflow-hidden border-white/10 bg-white/5 backdrop-blur-md shadow-2xl transition-all hover:scale-[1.02] hover:border-primary/30 group cursor-pointer"
                    onClick={() => onSelect(p)}
                >
                    <div className="relative h-48 w-full overflow-hidden bg-muted/20">
                        {p.images?.[0]?.startsWith('http') ? (
                            <Image
                                src={p.images[0]}
                                alt={p.name}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center text-7xl animate-pulse">
                                {p.images?.[0] || '📦'}
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                            <span className="text-white text-xs font-bold uppercase tracking-wider">View Details</span>
                        </div>
                    </div>
                    <CardHeader className="p-5 pb-2">
                        <div className="flex justify-between items-start gap-2">
                            <CardTitle className="text-sm font-bold leading-tight group-hover:text-primary transition-colors">{p.name}</CardTitle>
                            <div className="text-lg font-black text-primary font-mono tabular-nums">${p.price.amount}</div>
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                            {p.description}
                        </p>
                    </CardHeader>
                    <CardFooter className="p-5 pt-2">
                        <Button
                            variant="default"
                            size="sm"
                            className="w-full text-xs font-bold shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-emerald-600 border-none hover:opacity-90 active:scale-95 transition-all"
                        >
                            Purchase Now
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}

interface QuantityCardProps {
    item: string
    onSelect: (quantity: number) => void
    initialQuantity?: number
}

export function QuantityCard({ item, onSelect, initialQuantity = 1 }: QuantityCardProps) {
    const [quantity, setQuantity] = React.useState(initialQuantity)

    return (
        <Card className="w-full max-w-sm border-primary/20 bg-muted/30">
            <CardHeader className="py-3">
                <CardTitle className="text-sm font-bold">Select Quantity</CardTitle>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{item}</p>
            </CardHeader>
            <CardContent className="flex items-center justify-between py-2">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full border-primary/20"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                        -
                    </Button>
                    <span className="text-lg font-bold w-4 text-center">{quantity}</span>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full border-primary/20"
                        onClick={() => setQuantity(Math.min(99, quantity + 1))}
                    >
                        +
                    </Button>
                </div>
                <Button size="sm" className="font-bold text-xs px-6" onClick={() => onSelect(quantity)}>
                    Select
                </Button>
            </CardContent>
        </Card>
    )
}

interface OrderConfirmationCardProps {
    details: { label: string; value: string | number; highlight?: boolean }[]
    onConfirm: () => void
    onCancel: () => void
}

export function OrderConfirmationCard({ details, onConfirm, onCancel }: OrderConfirmationCardProps) {
    return (
        <Card className="w-full max-w-sm border-primary/30 bg-primary/5 shadow-lg shadow-primary/5">
            <CardHeader className="py-3 border-b border-primary/10">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <ShieldCheck size={18} className="text-primary" />
                    Confirm Agentic Payment
                </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 py-4">
                {details.map((detail, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{detail.label}</span>
                        <strong className={cn(detail.highlight && "text-primary font-bold")}>
                            {detail.value}
                        </strong>
                    </div>
                ))}
            </CardContent>
            <CardFooter className="flex gap-2 p-3 bg-muted/20">
                <Button variant="ghost" size="sm" className="flex-1 text-xs font-bold" onClick={onCancel}>
                    Cancel
                </Button>
                <Button variant="default" size="sm" className="flex-1 text-xs font-bold" onClick={onConfirm}>
                    Confirm & Pay
                </Button>
            </CardFooter>
        </Card>
    )
}

interface PaymentMethodSelectorCardProps {
    methods: any[] // eslint-disable-line @typescript-eslint/no-explicit-any
    onSelect: (method: any) => void // eslint-disable-line @typescript-eslint/no-explicit-any
}

export function PaymentMethodSelectorCard({ methods, onSelect }: PaymentMethodSelectorCardProps) {
    return (
        <Card className="w-full max-w-sm border-primary/20 bg-muted/30">
            <CardHeader className="py-3">
                <CardTitle className="text-sm font-bold">Choose Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 py-2">
                {methods.map((method, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-3 p-3 rounded-lg bg-card border border-primary/5 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer group"
                        onClick={() => onSelect(method)}
                    >
                        <div className="h-8 w-12 rounded bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground uppercase group-hover:bg-primary/10 group-hover:text-primary">
                            {method.card_brand}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold">•••• {method.card_last4}</span>
                            <span className="text-[10px] text-muted-foreground uppercase opacity-70">Expires {method.card_exp_month}/{method.card_exp_year}</span>
                        </div>
                        {method.is_default && (
                            <Badge variant="outline" className="ml-auto text-[8px] h-4 px-1 opacity-50">DEFAULT</Badge>
                        )}
                    </div>
                ))}
                {methods.length === 0 && (
                    <div className="text-center py-4 text-xs text-muted-foreground italic">
                        No cards found. Please add one in Dashboard.
                    </div>
                )}
            </CardContent>
            <CardFooter className="p-3 border-t border-primary/5 flex flex-col gap-2">
                <AddCardDialog
                    trigger={
                        <Button variant="outline" size="sm" className="w-full text-[10px] uppercase font-bold tracking-widest text-primary border-primary/20 hover:bg-primary/5">
                            <Plus size={14} className="mr-2" /> Add New Payment Method
                        </Button>
                    }
                />
                <Button variant="link" size="sm" className="w-full text-[10px] uppercase font-bold tracking-widest text-muted-foreground" asChild>
                    <Link href="/dashboard">Advanced Management</Link>
                </Button>
            </CardFooter>
        </Card>
    )
}

export function SuccessBanner({ orderNumber }: { orderNumber: string }) {
    return (
        <Card className="w-full max-w-sm border-green-500/20 bg-green-500/5">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-4 rounded-full bg-green-500/20 p-3 text-green-500">
                    <CheckCircle size={40} weight="fill" />
                </div>
                <h3 className="mb-1 text-xl font-bold text-green-700 dark:text-green-400">Payment Successful</h3>
                <p className="mb-6 text-xs text-muted-foreground">
                    Order <strong>#{orderNumber}</strong> has been confirmed.<br />
                    A receipt has been sent to your email.
                </p>
                <div className="flex w-full gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1 text-xs font-bold border-green-500/30 hover:bg-green-500/10" asChild>
                        <Link href={`/receipt?order_id=${orderNumber}`}>View Invoice</Link>
                    </Button>
                    <Button variant="default" size="sm" className="flex-1 text-xs font-bold bg-green-600 hover:bg-green-700">
                        Track Order
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

export { RiskAnalysis } from "./risk-analysis"

export { FulfillmentTimeline } from "../orders/fulfillment-timeline"
