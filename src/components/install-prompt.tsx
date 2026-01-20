"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IOSInstallPrompt } from "./ios-install-prompt";

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Check if installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setShowPrompt(false);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setShowPrompt(false);
        }
        setDeferredPrompt(null);
    };

    // Return IOS prompt if not handled by standard event (Android/Desktop)
    if (!showPrompt) return <IOSInstallPrompt />;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
            <div className="bg-primary text-primary-foreground p-4 rounded-lg shadow-lg flex flex-col gap-3 animate-in slide-in-from-bottom duration-500">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-lg">Install App</h3>
                        <p className="text-sm opacity-90">Add to home screen for quick access</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground/70 hover:text-white" onClick={() => setShowPrompt(false)}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
                <Button onClick={handleInstall} variant="secondary" className="w-full gap-2 font-semibold">
                    <Download className="w-4 h-4" />
                    Install Now
                </Button>
            </div>
        </div>
    );
}
