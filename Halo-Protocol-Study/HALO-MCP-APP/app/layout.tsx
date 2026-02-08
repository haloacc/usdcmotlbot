import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Halo MCP Studio",
  description: "Create your MCP server in minutes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm font-display">H</span>
              </div>
              <span className="font-semibold text-lg font-display tracking-tight">Halo MCP Studio</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
              <span>Docs</span>
              <span>Support</span>
              <div className="w-8 h-8 rounded-full bg-slate-200"></div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}