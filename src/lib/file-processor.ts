import * as XLSX from 'xlsx';
import mammoth from 'mammoth';

export interface ProcessedPrompt {
    originalText: string;
    sourceFile: string;
}

// Helper to clean and validate text
function cleanText(text: string): string | null {
    if (!text || typeof text !== 'string') return null;

    // 1. Remove numbering schemes:
    // "1.", "1-", "(1)", "1)", "Chapter 1:", "Section 5 -", "A."
    let cleaned = text.replace(/^(\d+[\.\-\)\s]+|\([0-9]+\)\s*|[a-z]\.|\s*-\s*)+/i, '').trim();

    // 2. Remove "Prompt:" or "Subject:" prefix
    cleaned = cleaned.replace(/^(prompt|subject|description|image)[:\s]+/i, '').trim();

    // 3. Filter out junk/headers
    // Too short?
    if (cleaned.length < 15) return null;

    // Looks like a header? (Short, no verbs usually, keywords)
    // Matches: "Chapter 1", "Introduction", "Page 5", "Group A", "Prompt List"
    if (/^(chapter|section|page|group|part|prompt list|title|intro|header)\s+\d+/i.test(cleaned)) return null;
    if (/^(introduction|conclusion|summary|table of contents)$/i.test(cleaned)) return null;

    // Remove quotes if the whole string is quoted
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
        cleaned = cleaned.slice(1, -1).trim();
    }

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
