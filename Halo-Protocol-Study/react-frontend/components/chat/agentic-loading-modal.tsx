"use client"

import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { CheckCircle, Spinner, Lightning, ShieldCheck, Key, Rocket } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

interface AgenticLoadingModalProps {
    open: boolean
    onComplete: () => void
}

interface LoadingStep {
    id: number
    icon: React.ReactNode
    title: string
    description: string
    duration: number
}

const LOADING_STEPS: LoadingStep[] = [
    {
        id: 1,
        icon: <Lightning size={24} weight="fill" className="text-blue-400" />,
        title: "Analyzing Payment Intent",
        description: "Parsing transaction requirements and validating amount",
        duration: 500
    },
    {
        id: 2,
        icon: <ShieldCheck size={24} weight="fill" className="text-purple-400" />,
        title: "Negotiating Protocol",
        description: "Establishing secure connection with merchant",
        duration: 800
    },
    {
        id: 3,
        icon: <Key size={24} weight="fill" className="text-emerald-400" />,
        title: "Generating Passkey from Stripe",
        description: "Creating encrypted payment credentials",
        duration: 1000
    },
    {
        id: 4,
        icon: <Rocket size={24} weight="fill" className="text-amber-400" />,
        title: "Executing Agentic Checkout",
        description: "Processing payment through orchestration layer",
        duration: 700
    },
    {
        id: 5,
        icon: <CheckCircle size={24} weight="fill" className="text-green-400" />,
        title: "Payment Completed",
        description: "Transaction successful and verified",
        duration: 500
    }
]

export function AgenticLoadingModal({ open, onComplete }: AgenticLoadingModalProps) {
    const [currentStep, setCurrentStep] = React.useState(0)
    const [completedSteps, setCompletedSteps] = React.useState<number[]>([])

    React.useEffect(() => {
        if (!open) {
            setCurrentStep(0)
            setCompletedSteps([])
            return
        }

        // Start the sequence
        let stepIndex = 0
        const runStep = () => {
            if (stepIndex >= LOADING_STEPS.length) {
                // All steps complete
                setTimeout(() => {
                    onComplete()
                }, 300)
                return
            }

            const step = LOADING_STEPS[stepIndex]
            setCurrentStep(step.id)

            setTimeout(() => {
                setCompletedSteps(prev => [...prev, step.id])
                stepIndex++
                runStep()
            }, step.duration)
        }

        runStep()
    }, [open, onComplete])

    return (
        <Dialog open={open} onOpenChange={() => { }}>
            <DialogContent
                className="sm:max-w-lg rounded-[2rem] bg-zinc-950 border-white/5"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle className="text-2xl tracking-tighter text-white">
                        Processing Payment
                    </DialogTitle>
                    <DialogDescription className="text-zinc-500 font-light pt-1">
                        Agentic orchestration in progress
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-6 pb-2">
                    {LOADING_STEPS.map((step) => {
                        const isActive = currentStep === step.id
                        const isCompleted = completedSteps.includes(step.id)
                        const isPending = !isActive && !isCompleted

                        return (
                            <div
                                key={step.id}
                                className={cn(
                                    "flex items-start gap-4 p-4 rounded-xl border transition-all duration-300",
                                    isActive && "bg-white/5 border-white/20 scale-[1.02]",
                                    isCompleted && "bg-green-500/5 border-green-500/20",
                                    isPending && "bg-zinc-900/30 border-white/5 opacity-40"
                                )}
                            >
                                {/* Icon */}
                                <div className={cn(
                                    "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all",
                                    isActive && "bg-white/10 animate-pulse",
                                    isCompleted && "bg-green-500/20",
                                    isPending && "bg-zinc-800/50"
                                )}>
                                    {isCompleted ? (
                                        <CheckCircle size={24} weight="fill" className="text-green-400" />
                                    ) : isActive ? (
                                        <Spinner size={24} className="animate-spin text-white" />
                                    ) : (
                                        step.icon
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className={cn(
                                        "text-sm font-bold mb-1 transition-colors",
                                        isActive && "text-white",
                                        isCompleted && "text-green-400",
                                        isPending && "text-zinc-600"
                                    )}>
                                        {step.title}
                                    </div>
                                    <div className={cn(
                                        "text-xs transition-colors",
                                        isActive && "text-zinc-400",
                                        isCompleted && "text-green-600/70",
                                        isPending && "text-zinc-700"
                                    )}>
                                        {step.description}
                                    </div>
                                </div>

                                {/* Status Indicator */}
                                <div className="flex-shrink-0">
                                    {isActive && (
                                        <div className="flex gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse delay-75" />
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse delay-150" />
                                        </div>
                                    )}
                                    {isCompleted && (
                                        <div className="text-[10px] font-bold text-green-400 uppercase tracking-wider">
                                            Done
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Progress Bar */}
                <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
                        <span>Progress</span>
                        <span>{completedSteps.length} / {LOADING_STEPS.length}</span>
                    </div>
                    <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 transition-all duration-500 ease-out"
                            style={{ width: `${(completedSteps.length / LOADING_STEPS.length) * 100}%` }}
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
