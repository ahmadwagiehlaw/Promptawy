import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export interface AIResponse {
    tags: string[];
    meta: {
        action: string;
        place: string;
        clothes: string;
        pose: string;
        lighting: string;
        art_style: string;
    };
    sampleDescription: string;
}

const SYSTEM_PROMPT = `
You are an expert AI Prompt Engineer and Classifier.
Your task is to analyze a raw image generation prompt and extract structured metadata to help organize it in a database.
You must return a strictly valid JSON object.

Input: "A futuristic cyborg samurai standing in neon rain, cyberpunk city background, detailed armor, 8k"
Output Structure needed:
{
  "tags": ["cyborg", "samurai", "cyberpunk", "neon", "rain", "sci-fi"],
  "meta": {
    "action": "standing",
    "place": "cyberpunk city, neon streets",
    "clothes": "detailed armor",
    "pose": "standing",
    "lighting": "neon, moody",
    "art_style": "cyberpunk, realistic, 8k"
  },
  "sampleDescription": "A visual description of the scene for preview generation"
}

If a field is not present or applicable, use "Generic" or an empty string. Focus on keywords useful for search.
`;

export async function analyzePrompt(text: string): Promise<AIResponse> {
    if (!apiKey) {
        throw new Error("Gemini API Key is missing");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    try {
        const result = await model.generateContent([
            SYSTEM_PROMPT,
            `Analyze this prompt: "${text}"`
        ]);
        const response = await result.response;
        const textResponse = response.text();

        // Clean code blocks if present
        const jsonString = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();

        return JSON.parse(jsonString) as AIResponse;
    } catch (error) {
        console.error("Gemini Analysis Error:", error);
        // Return fallback structure
        return {
            tags: ["untagged"],
            meta: { action: "", place: "", clothes: "", pose: "", lighting: "", art_style: "" },
            sampleDescription: text
        };
    }
}

export async function generateVisualDescription(promptText: string): Promise<string> {
    if (!apiKey) {
        throw new Error("Gemini API Key is missing");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    try {
        const result = await model.generateContent([
            "You are a visual artist. Describe this image prompt in vivid, flowing detail as if it were a finished painting or photograph. Focus on atmosphere, lighting, and texture. Keep it under 50 words.",
            `Prompt: "${promptText}"`
        ]);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini Visual Description Error:", error);
        throw error;
    }
}
