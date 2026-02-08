"use client"

import { Sidebar } from "@/components/layout/sidebar";
import { OrchestratorProvider } from "@/hooks/use-orchestrator";
import { ProtocolInspector } from "@/components/layout/protocol-inspector";
import { usePathname, useRouter } from "next/navigation";
import { useLayoutEffect, useState } from "react";

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter(); // Helper for redirection
    const isApiExplorer = pathname === '/api-explorer';
    const isCheckout = pathname?.startsWith('/checkout');
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Auth Protection
    useLayoutEffect(() => {
        const token = localStorage.getItem('halo_token');
        if (!token) {
            router.replace('/auth/login');
        } else {
            setIsAuthenticated(true);
        }
    }, [pathname, router]);

    // Prevent flashing of protected content
    if (!isAuthenticated) {
        return null; // Or a loading spinner
    }

    return (
        <OrchestratorProvider>
            <div className="flex h-screen overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-y-auto bg-background transition-all duration-300">
                    {children}
                </main>
                {!isCheckout && !isApiExplorer && <ProtocolInspector />}
            </div>
        </OrchestratorProvider>
    );
}
