import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/context/AuthContext";
import { InstallPrompt } from "@/components/install-prompt";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
    title: "Promptawy",
    description: "AI Prompt Manager & Search Engine",
    manifest: "/manifest.json",
};

export const viewport: Viewport = {
    themeColor: "#000000",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false, // Often desired for PWAs to feel like native apps
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable)}>
                <AuthProvider>
                    {children}
                    <InstallPrompt />
                </AuthProvider>
            </body>
        </html>
    );
}
