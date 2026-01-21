import * as XLSX from 'xlsx';
import mammoth from 'mammoth';

export interface ProcessedPrompt {
    originalText: string;
    sourceFile: string;
}

// Helper to clean and validate text
function cleanText(text: string): string | null {
    if (!text || typeof text !== 'string') return null;

    // Remove leading numbers/bullets (e.g. "1.", "2-", "-")
    let cleaned = text.replace(/^[\d\-\.\)\s]+/, '').trim();

    // Remove "Prompt:" prefix if exists
    cleaned = cleaned.replace(/^prompt[:\s]+/i, '').trim();

    // Filter out content that is likely not a prompt (too short, or generic headers)
    if (cleaned.length < 15) return null; // Increased threshold
    if (/^(title|introduction|chapter|page|header)/i.test(cleaned)) return null;

    return cleaned;
}

export async function parseFile(file: File): Promise<ProcessedPrompt[]> {
    const fileName = file.name;
    const extension = fileName.split('.').pop()?.toLowerCase();

    // Use a Set to track unique texts within this file immediately
    const seen = new Set<string>();
    let rawPrompts: ProcessedPrompt[] = [];

    if (extension === 'xlsx' || extension === 'xls' || extension === 'csv') {
        rawPrompts = await parseExcel(file);
    } else if (extension === 'docx') {
        rawPrompts = await parseWord(file);
    } else if (extension === 'txt') {
        rawPrompts = await parseText(file);
    } else {
        throw new Error(`Unsupported file type: ${extension}`);
    }

    // Filter and deduplicate
    return rawPrompts.filter(p => {
        const hash = p.originalText.toLowerCase();
        if (seen.has(hash)) return false;
        seen.add(hash);
        return true;
    });
}

async function parseExcel(file: File): Promise<ProcessedPrompt[]> {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

    const prompts: ProcessedPrompt[] = [];

    for (let row of jsonData) {
        if (Array.isArray(row)) {
            for (let cell of row) {
                const cleaned = cleanText(cell);
                if (cleaned) {
                    prompts.push({
                        originalText: cleaned,
                        sourceFile: file.name
                    });
                }
            }
        }
    }
    return prompts;
}

async function parseWord(file: File): Promise<ProcessedPrompt[]> {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value;

    const lines = text.split(/\n+/); // Split by any newlines

    return lines
        .map(line => cleanText(line))
        .filter((line): line is string => line !== null)
        .map(text => ({
            originalText: text,
            sourceFile: file.name
        }));
}

async function parseText(file: File): Promise<ProcessedPrompt[]> {
    const text = await file.text();
    const lines = text.split(/\n+/);

    return lines
        .map(line => cleanText(line))
        .filter((line): line is string => line !== null)
        .map(text => ({
            originalText: text,
            sourceFile: file.name
        }));
}
