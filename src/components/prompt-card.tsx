import { Prompt } from '@/lib/firestore';
import { VisualizerDialog } from './visualizer-dialog';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from 'lucide-react'; // Wait, standard badge is a component
import { Button } from '@/components/ui/button';
import { Copy, Image as ImageIcon, MoreHorizontal } from 'lucide-react';

// Create a simple Badge component since I managed to miss installing it or creating it
function SimpleBadge({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 ${className}`}>
            {children}
        </span>
    );
}

export function PromptCard({ prompt }: { prompt: Prompt }) {
    return (
        <Card className="overflow-hidden group hover:border-primary/50 transition-all duration-300">
            <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start gap-2">
                    <SimpleBadge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">
                        {prompt.meta.art_style || 'General'}
                    </SimpleBadge>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
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
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Copy className="w-3 h-3" />
                </Button>
            </CardFooter>
        </Card>
    );
}
