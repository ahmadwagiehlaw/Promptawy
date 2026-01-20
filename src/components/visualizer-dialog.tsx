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
import { Sparkles, Loader2, Image as ImageIcon } from "lucide-react";
import { generateVisualDescription } from "@/lib/gemini"; // We need to implement this
import { Prompt } from "@/lib/firestore"; // Updated import

export function VisualizerDialog({ prompt }: { prompt: Prompt }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [description, setDescription] = useState<string | null>(null);

    const handleVisualize = async () => {
        setIsLoading(true);
        try {
            const result = await generateVisualDescription(prompt.originalText);
            setDescription(result);
        } catch (error) {
            console.error("Failed to generate description:", error);
            setDescription("Failed to generate visual description. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-2">
                    <ImageIcon className="w-3 h-3" />
                    Visualize
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-yellow-500" />
                        AI Visual Description
                    </DialogTitle>
                    <DialogDescription>
                        Gemini's interpretation of how this prompt would look.
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-8 space-y-2">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Dreaming up the scene...</p>
                        </div>
                    ) : !description ? (
                        <div className="flex flex-col items-center justify-center py-6">
                            <Button onClick={handleVisualize} className="w-full">
                                Generate Visual Description
                            </Button>
                        </div>
                    ) : (
                        <div className="p-4 bg-muted/50 rounded-lg text-sm leading-relaxed whitespace-pre-wrap">
                            {description}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
