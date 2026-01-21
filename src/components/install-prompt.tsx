"use client";

import { useEffect, useState } from "react";
import { Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IOSInstallPrompt } from "./ios-install-prompt";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            console.log("📱 PWA Install Prompt Captured!", e);
            e.preventDefault();
            setDeferredPrompt(e);
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log("📱 App is already in standalone mode");
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
    if (!deferredPrompt) return <IOSInstallPrompt />;

    return (
        <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center flex flex-col items-center gap-2">
                        <div className="p-3 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 mb-2">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        Install Promptawy App
                    </DialogTitle>
                    <DialogDescription className="text-center text-base pt-2">
                        Get the best experience by installing the app.
                        Works offline, syncs instantly, and looks great on your home screen.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-3 py-4">
                    <Button onClick={handleInstall} size="lg" className="w-full gap-2 text-md font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                        <Download className="w-5 h-5" />
                        Install Application
                    </Button>
                    <Button variant="ghost" onClick={() => setShowPrompt(false)} className="text-muted-foreground hover:text-foreground">
                        Maybe Later
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
