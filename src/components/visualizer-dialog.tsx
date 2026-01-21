"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Wand2 } from "lucide-react"; // Changed icon
import { enhancePrompt } from "@/lib/gemini"; // Updated import
import { Prompt } from "@/lib/firestore";

export function VisualizerDialog({ prompt }: { prompt: Prompt }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [description, setDescription] = useState<string | null>(null);

    const handleEnhance = async () => {
        setIsLoading(true);
        try {
            const result = await enhancePrompt(prompt.originalText);
            setDescription(result);
        } catch (error) {
            console.error("Failed to enhance:", error);
            alert("Enhancement failed. Check API Key or Console.");
            setDescription("Could not enhance prompt.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 hover:from-purple-500/20 hover:to-blue-500/20 border-purple-200/20">
                    <Wand2 className="w-3 h-3 text-purple-400" />
                    Enhance
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-purple-400">
                        <Sparkles className="w-5 h-5" />
                        AI Prompt Enhancer
                    </DialogTitle>
                    <DialogDescription>
                        Rewrite your prompt to be more artistic, detailed, and safe for image generation.
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-8 space-y-2">
                            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                            <p className="text-sm text-muted-foreground animate-pulse">Polishing your idea...</p>
                        </div>
                    ) : !description ? (
                        <div className="flex flex-col items-center justify-center py-6 space-y-4">
                            <div className="p-4 bg-secondary/50 rounded-lg text-sm text-muted-foreground italic w-full text-center">
                                "{prompt.originalText.slice(0, 100)}..."
                            </div>
                            <Button onClick={handleEnhance} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg shadow-purple-900/20">
                                <Sparkles className="w-4 h-4 mr-2" />
                                Generate Enhanced Version
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="p-4 bg-muted/50 rounded-lg text-sm leading-relaxed whitespace-pre-wrap border border-purple-500/20 relative">
                                {description}
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="absolute top-2 right-2 h-6 w-6"
                                    onClick={() => {
                                        navigator.clipboard.writeText(description);
                                        alert("Copied!");
                                    }}
                                >
                                    <Sparkles className="w-3 h-3" />
                                </Button>
                            </div>
                            <Button onClick={handleEnhance} variant="outline" className="w-full">
                                try again
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
