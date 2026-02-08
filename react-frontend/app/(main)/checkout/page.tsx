"use client"

import * as React from "react"
import { useChat } from "@/hooks/use-chat"
// import { useOrchestrator } from "@/hooks/use-orchestrator"
import { ChatInput } from "@/components/chat/chat-input"
import { MessageBubble } from "@/components/chat/message-bubble"
// import { ProtocolLogViewer } from "@/components/protocol-log-viewer"
import { ProtocolInspector } from "@/components/layout/protocol-inspector"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingCart, ArrowLeft } from "@phosphor-icons/react"
import Link from "next/link"

export default function CheckoutPage() {
    const {
        messages,
        sendMessage,
        isLoading
    } = useChat()

    // const { debugLogs, clearDebugLogs } = useOrchestrator()
    const messagesEndRef = React.useRef<HTMLDivElement>(null)

    // Auto-scroll chat
    React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    return (
        <div className="container mx-auto p-4 sm:p-6 max-w-[1600px] h-[calc(100vh-4rem)] flex flex-col gap-4">
            <header className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" asChild className="-ml-2 gap-2 text-muted-foreground">
                        <Link href="/products">
                            <ArrowLeft size={16} />
                            Back
                        </Link>
                    </Button>
                    <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                        <ShoppingCart size={24} className="text-primary" />
                        Agentic Checkout
                    </h1>
                </div>
            </header>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                {/* LEFT PANEL: Chat Interface (5 cols) */}
                <div className="lg:col-span-5 flex flex-col gap-4 min-h-0 h-full">
                    <Card className="flex-1 flex flex-col overflow-hidden border-r border-border/50 shadow-none bg-background/50 backdrop-blur-sm rounded-r-none">
                        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-8 opacity-50">
                                    <ShoppingCart size={48} className="mb-4 opacity-20" />
                                    <p className="text-sm">Start a conversation to buy something.</p>
                                    <p className="text-xs mt-2">Try &quot;Buy a gaming laptop&quot; or &quot;I want some headphones&quot;</p>
                                </div>
                            ) : (
                                messages.map((msg) => (
                                    <MessageBubble key={msg.id} message={msg} />
                                ))
                            )}
                            {isLoading && (
                                <div className="flex justify-start mb-4">
                                    <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 text-sm flex items-center gap-2">
                                        <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </CardContent>
                        <div className="p-4 bg-background/80 backdrop-blur-md border-t">
                            <ChatInput onSendMessage={sendMessage} disabled={isLoading} />
                        </div>
                    </Card>
                </div>

                {/* RIGHT PANEL: Protocol Inspector (7 cols) */}
                <div className="lg:col-span-7 flex flex-col h-full overflow-hidden min-h-0 pl-0">
                    <Card className="h-full flex flex-col border border-white/10 rounded-l-none bg-[#0c0c0e] overflow-hidden shadow-inner">
                        <ProtocolInspector mode="embedded" className="h-full w-full border-none shadow-none" />
                    </Card>
                </div>
            </div>
        </div>
    )
}
