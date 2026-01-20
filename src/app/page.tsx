'use client';

import { Search, Plus, LogIn } from "lucide-react";
import { useState, useEffect } from "react";
import { FirestoreService, Prompt } from "@/lib/firestore";
import { ResultsGrid } from "@/components/results-grid";
import { UploadArea } from "@/components/upload-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoginDialog } from "@/components/login-dialog";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
    const { user, loading: authLoading } = useAuth();
    const [query, setQuery] = useState("");
    const [showUpload, setShowUpload] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [loadingPrompts, setLoadingPrompts] = useState(false);

    // Fetch prompts when user changes
    useEffect(() => {
        if (user) {
            setLoadingPrompts(true);
            FirestoreService.getPrompts(user.uid)
                .then(data => {
                    setPrompts(data);
                })
                .catch(err => console.error("Failed to fetch prompts", err))
                .finally(() => setLoadingPrompts(false));
        } else {
            setPrompts([]);
        }
    }, [user]);

    // Filter prompts locally
    const filteredPrompts = prompts.filter(p => {
        if (!query) return true;
        const lowerQuery = query.toLowerCase();
        return (
            p.originalText.toLowerCase().includes(lowerQuery) ||
            p.tags.some(t => t.toLowerCase().includes(lowerQuery)) ||
            (p.meta.art_style && p.meta.art_style.toLowerCase().includes(lowerQuery))
        );
    });

    if (authLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Loading...</div>;
    }

    if (!user) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background relative overflow-hidden">
                <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/10 via-background to-background pointer-events-none"></div>
                <div className="text-center space-y-6 max-w-lg">
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                        Promptawy
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        Manage, organize, and visualize your AI prompts across all your devices.
                        Sign in to sync your library.
                    </p>
                    <Button onClick={() => setShowLogin(true)} size="lg" className="gap-2">
                        <LogIn className="w-5 h-5" />
                        Sign in to Get Started
                    </Button>
                    <LoginDialog open={showLogin} onOpenChange={setShowLogin} />
                </div>
            </main>
        );
    }

    return (
        <main className="flex min-h-screen flex-col relative overflow-hidden bg-background">

            {/* Background Decor */}
            <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/10 via-background to-background pointer-events-none"></div>

            {/* Header / Search Area */}
            <div className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b">
                <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center gap-4">

                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 shrink-0">
                        Promptawy
                    </h1>

                    <div className="flex-1 w-full max-w-2xl relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                            className="pl-9 bg-secondary/50 border-secondary focus:bg-background transition-all"
                            placeholder="Search prompts by tags, style, or content..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                        />
                    </div>

                    <Button
                        variant={showUpload ? "secondary" : "default"}
                        onClick={() => setShowUpload(!showUpload)}
                        className="shrink-0 gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        {showUpload ? "Close Import" : "Import Prompts"}
                    </Button>

                </div>
            </div>

            {/* Content Area */}
            <div className="container mx-auto px-4 py-8 flex-1">

                {showUpload && (
                    <div className="mb-8 p-4 border rounded-lg bg-card/50 backdrop-blur-sm animate-in slide-in-from-top-4 fade-in duration-300">
                        <UploadArea onUploadComplete={() => {
                            // Refresh prompts
                            if (user) {
                                FirestoreService.getPrompts(user.uid).then(setPrompts);
                            }
                            setShowUpload(false);
                        }} />
                    </div>
                )}

                {/* Quick Tags (Only show if no query) */}
                {!query && !showUpload && (
                    <div className="flex flex-wrap justify-center gap-2 mb-8 opacity-70">
                        {["Cyberpunk", "Portrait", "Watercolor", "Cinematic", "8k", "Anime"].map((tag) => (
                            <button
                                key={tag}
                                onClick={() => setQuery(tag)}
                                className="px-3 py-1 rounded-full bg-secondary/30 hover:bg-secondary text-xs transition-colors border border-white/5"
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                )}

                {loadingPrompts ? (
                    <div className="text-center py-20 text-muted-foreground">Loading your prompts...</div>
                ) : (
                    <ResultsGrid prompts={filteredPrompts} />
                )}

            </div>

        </main>
    );
}
