"use client"

import * as React from "react"
import Image from "next/image"
import { Info } from "@phosphor-icons/react"

export function MobileOverlay() {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-950/90 p-8 backdrop-blur-md md:hidden">
            <div className="flex flex-col items-center space-y-8 text-center">

                {/* Logo */}
                <div className="relative h-12 w-32 opacity-90">
                    <Image
                        src="/halo-logo.png"
                        alt="Halo"
                        fill
                        className="object-contain brightness-0 invert"
                        priority
                    />
                </div>

                {/* Content */}
                <div className="max-w-[280px] space-y-4 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Info size={32} weight="fill" />
                    </div>

                    <h3 className="text-lg font-bold text-white">
                        Desktop Optimization
                    </h3>

                    <p className="text-sm leading-relaxed text-zinc-400">
                        This agentic orchestrator is currently available only in desktop/webview environments for optimal performance.
                    </p>
                </div>

                <div className="text-[10px] font-medium uppercase tracking-widest text-zinc-600">
                    Halo • Agentic Commerce
                </div>
            </div>
        </div>
    )
}
