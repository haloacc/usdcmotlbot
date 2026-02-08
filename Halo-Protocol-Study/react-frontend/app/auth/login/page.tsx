"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { apiRequest, setToken } from "@/lib/api"
import Script from "next/script"
import Image from "next/image"

// Define custom event for Google Sign In
declare global {
    interface Window {
        handleGoogleSignIn: (response: any) => Promise<void>; // eslint-disable-line @typescript-eslint/no-explicit-any
        google: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    }
}

export default function LoginPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const buttonRef = React.useRef<HTMLDivElement>(null);

    // Initial sign-in handler (wrapped to match GSI expectation)
    const handleCredentialResponse = React.useCallback(async (response: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            setIsLoading(true);
            const result = await apiRequest('/api/auth/google', {
                method: 'POST',
                body: JSON.stringify({ id_token: response.credential })
            });

            if (result.session?.token) {
                setToken(result.session.token);
                router.push('/');
            }
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            setError(err.message || "Google sign-in failed");
            setIsLoading(false);
        }
    }, [router]);

    // Initialize and render Google Button
    const initializeGoogleSignIn = React.useCallback(() => {
        if (!window.google || !buttonRef.current) return;

        try {
            window.google.accounts.id.initialize({
                client_id: "555244343357-8o2bjud92h32uc5cc44qk0p4tkl8lfap.apps.googleusercontent.com",
                callback: handleCredentialResponse,
                auto_select: false,
                cancel_on_tap_outside: true,
            });

            window.google.accounts.id.renderButton(
                buttonRef.current,
                {
                    theme: "outline",
                    size: "large",
                    type: "standard",
                    shape: "pill",
                    text: "signin_with",
                    width: "320",
                    logo_alignment: "left"
                }
            );
        } catch (e) {
            console.error("GSI Init Error:", e);
        }
    }, [handleCredentialResponse]);

    // Effect to render button on mount or when cleaning up
    useEffect(() => {
        // If script is already loaded (navigating back), render immediately
        if (window.google) {
            initializeGoogleSignIn();
        }

        // Handle window resize re-rendering if needed
        const handleResize = () => {
            if (window.google) initializeGoogleSignIn();
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [initializeGoogleSignIn]);

    return (
        <div className="w-full flex flex-col items-center">
            <Script
                src="https://accounts.google.com/gsi/client"
                strategy="afterInteractive"
                onLoad={initializeGoogleSignIn}
            />

            <div className="mb-12 flex flex-col items-center text-center">
                <div className="mb-8 select-none">
                    <div className="relative h-16 w-48">
                        <Image
                            src="/halo-logo.png"
                            alt="Halo"
                            fill
                            className="object-contain brightness-0 invert opacity-100"
                            onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement;
                                target.style.display = 'none';
                                target.parentElement!.innerHTML = '<span class="text-6xl font-black tracking-tighter text-white font-mono uppercase">HALO</span>';
                            }}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-4xl font-medium tracking-tighter text-white">
                        Welcome Back
                    </h2>
                    <p className="text-lg text-zinc-500 max-w-xs font-light leading-relaxed">
                        Sign in to access your agentic commerce dashboard
                    </p>
                </div>
            </div>

            {error && (
                <div className="mb-6 text-sm text-red-400 text-center bg-red-950/20 border border-red-900/50 p-4 rounded-2xl w-full max-w-sm">
                    {error}
                </div>
            )}

            {/* Google Sign In Div */}
            <div className="w-full flex flex-col items-center justify-center space-y-6">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-white/10 to-white/5 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
                    <div className="relative">
                        {/* Container for GSI Button */}
                        <div ref={buttonRef} className="min-h-[44px] min-w-[320px]"></div>
                    </div>
                </div>

                {isLoading && (
                    <div className="flex items-center gap-2 text-xs font-medium tracking-widest text-zinc-500 uppercase animate-pulse">
                        <div className="h-1 w-1 rounded-full bg-zinc-500 animate-bounce [animation-delay:-0.3s]" />
                        <div className="h-1 w-1 rounded-full bg-zinc-500 animate-bounce [animation-delay:-0.15s]" />
                        <div className="h-1 w-1 rounded-full bg-zinc-500 animate-bounce" />
                        <span>Authenticating</span>
                    </div>
                )}
            </div>
        </div>
    )
}
