import { cn } from "@/lib/utils"

export interface Message {
    id: string
    role: "user" | "bot"
    content: string | React.ReactNode
    timestamp: number
}

interface MessageBubbleProps {
    message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
    const isUser = message.role === "user"
    const isString = typeof message.content === "string"

    return (
        <div className={cn("flex w-full mb-4", isUser ? "justify-end" : "justify-start")}>
            <div
                className={cn(
                    "rounded-2xl px-4 py-3 text-sm",
                    isUser
                        ? "max-w-[80%] bg-primary text-primary-foreground rounded-br-sm shadow-sm"
                        : isString
                            ? "max-w-[80%] bg-muted text-foreground rounded-bl-sm"
                            : "w-full sm:max-w-md bg-transparent p-0" // Transparent for cards
                )}
            >
                {isString ? (
                    <div dangerouslySetInnerHTML={{ __html: message.content as string }} className="prose prose-sm dark:prose-invert" />
                ) : (
                    message.content
                )}
            </div>
        </div>
    )
}
