"use client"

import React from "react"
import Image from "next/image"

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-black p-4 lg:p-8">
            <div className="w-full max-w-[1200px] grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-16">

                {/* Left Side: Hero Card */}
                <div className="relative hidden h-full min-h-[700px] w-full flex-col justify-end rounded-[3rem] border border-white/10 bg-zinc-900/50 overflow-hidden lg:flex p-12 transition-all hover:border-white/20 group">

                    {/* Top Visual Section */}
                    <div className="absolute top-8 left-8 right-8 h-[55%] rounded-[2rem] overflow-hidden border border-white/5 bg-black/40">
                        <Image
                            src="/showcase-visual.png"
                            alt="Agentic Intelligence"
                            fill
                            className="object-cover opacity-90 transition-transform duration-1000 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-80" />
                    </div>

                    {/* Bottom Content */}
                    <div className="relative z-10 space-y-6">
                        <div className="space-y-4">
                            <h2 className="text-5xl font-medium tracking-tighter text-white leading-tight">
                                The OS for <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">Agentic Commerce</span>
                            </h2>
                            <p className="text-xl text-zinc-400 max-w-sm font-light leading-relaxed">
                                Orchestrate payments, negotiate protocols, and manage autonomous transactions.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Side: Auth Form */}
                <div className="flex items-center justify-center">
                    <div className="w-full max-w-sm px-4">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}

// FeaturePill component removed per user request
