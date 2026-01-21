import { Prompt } from '@/lib/firestore';
import { PromptCard } from './prompt-card';

export function ResultsGrid({ prompts, onDelete }: { prompts: Prompt[], onDelete?: (id: string) => void }) {
    if (prompts.length === 0) {
        return (
            <div className="text-center py-20 opacity-50">
                <p className="text-xl">No prompts found.</p>
                <p className="text-sm">Try uploading a file or changing your search.</p>
            </div>
        );
    }

    return (
        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4 p-4 pb-20 fade-in-up">
            {prompts.map((prompt) => (
                <div key={prompt.id} className="break-inside-avoid">
                    <PromptCard prompt={prompt} onDelete={onDelete} />
                </div>
            ))}
        </div>
    );
}
