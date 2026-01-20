"use client";

import { useEffect, useState } from "react";
import { X, Share, PlusSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export function IOSInstallPrompt() {
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // Check if user is on iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIosDevice);

        // Check if already installed
        const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
        setIsStandalone(isStandaloneMode);

        // Show prompt only on iOS and not standalone
        if (isIosDevice && !isStandaloneMode) {
            // Check if dismissed previously within 24h
            const lastDismissed = localStorage.getItem("iosInstallDismissed");
            if (!lastDismissed || Date.now() - parseInt(lastDismissed) > 86400000) {
                setShowPrompt(true);
            }
        }
    }, []);

    const dismiss = () => {
        setShowPrompt(false);
        localStorage.setItem("iosInstallDismissed", Date.now().toString());
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/90 backdrop-blur-md border-t shadow-2xl animate-in slide-in-from-bottom duration-500">
            <div className="container max-w-md mx-auto relative">
                <Button variant="ghost" size="icon" className="absolute top-0 right-0 -mt-2 -mr-2 text-muted-foreground" onClick={dismiss}>
                    <X className="w-4 h-4" />
                </Button>

                <div className="flex flex-col gap-3">
                    <h3 className="font-semibold text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                        Install Promptawy
                    </h3>
                    <p className="text-sm text-foreground/80">
                        Install this app on your home screen for quick access and a better experience.
                    </p>
                    <div className="flex items-center gap-2 text-sm font-medium mt-1">
                        <span>1. Tap</span>
                        <Share className="w-5 h-5 text-blue-500" />
                        <span>Share</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <span>2. Select</span>
                        <PlusSquare className="w-5 h-5 text-gray-500" />
                        <span>Add to Home Screen</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
