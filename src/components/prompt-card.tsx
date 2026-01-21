import { FirestoreService, Prompt } from '@/lib/firestore';
import { VisualizerDialog } from './visualizer-dialog';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check, Trash } from 'lucide-react';
import { useState } from 'react';

// Create a simple Badge component since I managed to miss installing it or creating it
function SimpleBadge({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 ${className}`}>
            {children}
        </span>
    );
}

export function PromptCard({ prompt, onDelete }: { prompt: Prompt, onDelete?: (id: string) => void }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(prompt.originalText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this prompt?")) {
            try {
                if (prompt.id) {
                    await FirestoreService.deletePrompt(prompt.id);
                    if (onDelete) onDelete(prompt.id);
                }
            } catch (error) {
                console.error("Delete failed", error);
                alert("Failed to delete prompt");
            }
        }
    };

    return (
        <Card className="overflow-hidden group hover:border-primary/50 transition-all duration-300">
            <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start gap-2">
                    <SimpleBadge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">
                        {prompt.meta.art_style || 'General'}
                    </SimpleBadge>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
                <p className="text-sm text-foreground/90 line-clamp-4 leading-relaxed">
                    {prompt.originalText}
                </p>

                <div className="flex flex-wrap gap-1 mt-3">
                    {prompt.tags.slice(0, 4).map(tag => (
                        <span key={tag} className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm">
                            #{tag}
                        </span>
                    ))}
                    {prompt.tags.length > 4 && (
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm">+{prompt.tags.length - 4}</span>
                    )}
                </div>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex justify-between items-center text-muted-foreground">
                <div className="flex gap-2">
                    <VisualizerDialog prompt={prompt} />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={handleDelete}
                        title="Delete Prompt"
                    >
                        <Trash className="w-4 h-4" />
                    </Button>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy}>
                    {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                </Button>
            </CardFooter>
        </Card>
    );
}
