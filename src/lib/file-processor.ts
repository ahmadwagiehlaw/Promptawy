import * as XLSX from 'xlsx';
import mammoth from 'mammoth';

export interface ProcessedPrompt {
    originalText: string;
    sourceFile: string;
}

export async function parseFile(file: File): Promise<ProcessedPrompt[]> {
    const fileName = file.name;
    const extension = fileName.split('.').pop()?.toLowerCase();

    if (extension === 'xlsx' || extension === 'xls' || extension === 'csv') {
        return parseExcel(file);
    } else if (extension === 'docx') {
        return parseWord(file);
    } else if (extension === 'txt') {
        return parseText(file);
    } else {
        throw new Error(`Unsupported file type: ${extension}`);
    }
}

async function parseExcel(file: File): Promise<ProcessedPrompt[]> {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

    const prompts: ProcessedPrompt[] = [];

    // Assume generic structure: Try to find long strings
    for (let row of jsonData) {
        if (Array.isArray(row)) {
            for (let cell of row) {
                if (typeof cell === 'string' && cell.length > 10) {
                    prompts.push({
                        originalText: cell.trim(),
                        sourceFile: file.name
                    });
                    // Break after finding the first prompt-like cell in a row? 
                    // Or collect all? Let's collect all for now but maybe later refine logic.
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

    // Split by newlines or paragraphs and filter empty
    const lines = text.split('\n').filter(line => line.trim().length > 10);

    return lines.map(line => ({
        originalText: line.trim(),
        sourceFile: file.name
    }));
}

async function parseText(file: File): Promise<ProcessedPrompt[]> {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim().length > 10);

    return lines.map(line => ({
        originalText: line.trim(),
        sourceFile: file.name
    }));
}
