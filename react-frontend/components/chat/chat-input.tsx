"use client"

import * as React from "react"
import { PaperPlaneRight, Microphone } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"


interface ChatInputProps {
    onSendMessage: (message: string) => void
    disabled?: boolean
}

export function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
    const [input, setInput] = React.useState("")
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!input.trim() || disabled) return
        onSendMessage(input)
        setInput("")
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }

    return (
        <div className="relative flex items-end gap-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-2 shadow-2xl focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Halo to buy something..."
                className="flex-1 resize-none bg-transparent px-4 py-3 text-base placeholder:text-muted-foreground/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 max-h-[120px] overflow-y-auto leading-relaxed"
                rows={1}
                disabled={disabled}
            />

            <div className="flex gap-2 pb-1.5 pr-1">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors" type="button">
                    <Microphone size={22} />
                </Button>
                <Button
                    size="icon"
                    className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-emerald-600 shadow-lg shadow-primary/20 hover:opacity-90 active:scale-90 transition-all"
                    onClick={() => handleSubmit()}
                    disabled={!input.trim() || disabled}
                >
                    <PaperPlaneRight size={18} weight="fill" />
                </Button>
            </div>
        </div>
    )
}
