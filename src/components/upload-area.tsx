'use client';

import { useState } from 'react';
import { Upload, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { parseFile } from '@/lib/file-processor';
import { FirestoreService } from '@/lib/firestore';
import { analyzePrompt } from '@/lib/gemini';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

export function UploadArea({ onUploadComplete }: { onUploadComplete?: () => void }) {
    const { user } = useAuth();
    const [isDragging, setIsDragging] = useState(false);
    const [status, setStatus] = useState<'idle' | 'parsing' | 'saving' | 'processing_ai' | 'done' | 'error'>('idle');
    const [statusMsg, setStatusMsg] = useState('');
    const [progress, setProgress] = useState(0);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => setIsDragging(false);

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) processFile(files[0]);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFile(e.target.files[0]);
        }
    };

    const processFile = async (file: File) => {
        if (!user) {
            setStatus('error');
            setStatusMsg('You must be signed in to upload.');
            return;
        }

        try {
            setStatus('parsing');
            setStatusMsg(`Reading ${file.name}...`);

            const prompts = await parseFile(file);

            setStatus('saving');
            setStatusMsg(`Found ${prompts.length} prompts. Saving to database...`);

            // Save raw prompts in batch (Much faster)
            const promptsToSave = prompts.map(p => ({
                originalText: p.originalText,
                sourceFile: p.sourceFile,
                tags: [],
                meta: {},
                createdAt: new Date(),
                userId: user.uid
            }));

            const savedIds = await FirestoreService.bulkAddPrompts(promptsToSave);

            setStatus('processing_ai');
            setStatusMsg('Starting AI Analysis...');

            // Start AI Analysis
            let completed = 0;
            const total = Math.min(prompts.length, 5); // Limit for demo due to API limits

            for (let i = 0; i < total; i++) {
                const id = savedIds[i];
                const promptText = prompts[i].originalText;

                setStatusMsg(`Analyzing prompt ${i + 1}/${total}...`);

                try {
                    const aiData = await analyzePrompt(promptText);
                    await FirestoreService.updatePrompt(id, {
                        tags: aiData.tags,
                        meta: aiData.meta,
                        sampleDescription: aiData.sampleDescription
                    });
                } catch (e) {
                    console.error("Analysis failed for prompt", i, e);
                }

                completed++;
                setProgress((completed / total) * 100);
            }

            setStatus('done');
            setStatusMsg('Import & Analysis Complete!');
            if (onUploadComplete) onUploadComplete();

        } catch (error) {
            console.error(error);
            setStatus('error');
            setStatusMsg('Error processing file. See console.');
        }
    };

    return (
        <div className="w-full max-w-xl mx-auto mt-8">
            <Card
                className={cn(
                    "border-2 border-dashed transition-colors",
                    isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/20"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">

                    {status === 'idle' && (
                        <>
                            <div className="p-4 bg-secondary rounded-full">
                                <Upload className="w-8 h-8 text-secondary-foreground" />
                            </div>
                            <div className="text-center">
                                <h3 className="font-semibold text-lg">Upload Prompts</h3>
                                <p className="text-sm text-muted-foreground">Drag & drop Excel or Word files here</p>
                            </div>
                            <div className="relative">
                                <input
                                    type="file"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    accept=".xlsx,.xls,.docx,.txt"
                                    onChange={handleFileSelect}
                                />
                                <Button variant="outline">Select File</Button>
                            </div>
                        </>
                    )}

                    {(status === 'parsing' || status === 'saving' || status === 'processing_ai') && (
                        <>
                            <Loader2 className="w-10 h-10 animate-spin text-primary" />
                            <div className="text-center">
                                <p className="font-medium">{statusMsg}</p>
                                {status === 'processing_ai' && (
                                    <p className="text-xs text-muted-foreground mt-1">{Math.round(progress)}%</p>
                                )}
                            </div>
                        </>
                    )}

                    {status === 'done' && (
                        <>
                            <CheckCircle className="w-12 h-12 text-green-500" />
                            <p className="font-medium text-green-500">Success!</p>
                            <Button onClick={() => setStatus('idle')} variant="ghost">Upload Another</Button>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <AlertCircle className="w-12 h-12 text-destructive" />
                            <p className="font-medium text-destructive">{statusMsg}</p>
                            <Button onClick={() => setStatus('idle')} variant="ghost">Try Again</Button>
                        </>
                    )}

                </CardContent>
            </Card>
        </div>
    );
}
