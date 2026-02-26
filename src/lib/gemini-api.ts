import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

/**
 * Dynamic list of approved news sources for web searches
 */
export enum APPROVED_SOURCES_ENUM {
  TANGLE = "Tangle News",
  NYT = "New York Times",
  FREE_PRESS = "Free Press",
  DISPTACH = "The Dispatch",
  FIVETHIRTYEIGHT = "Five Thiry Eight",
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export class GeminiApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public cause?: unknown,
  ) {
    super(message);
    this.name = "GeminiApiError";
  }
}

export interface SummarizeBillOptions {
  billText: string;
  billTitle: string;
  maxLength?: number;
}

export async function summarizeBill({ billText, billTitle, maxLength = 300 }: SummarizeBillOptions): Promise<string> {
  try {
    const prompt = `You are summarizing U.S. congressional legislation for a non-partisan civic engagement platform.

Bill Title: ${billTitle}

Full Bill Text:
${billText}

Instructions:
- Write a concise, plain-English summary in 5-6 sentences (max ${maxLength} characters)
- Focus on WHAT the bill does, not WHY or political motivations
- Use narrative voice and professional, best-selling author prose (Examples include but not limited to David Brooks, David Epstein, Richard Grant, Neil Strauss)
- Avoid jargon, partisan framing, and superlatives
- Start with the core action (e.g., "This bill establishes...", "This bill requires...", "This bill amends...")
- Be factual and neutral
- If not enough text is given to create a summary, rely on open web-searches from APPROVED_SOURCES_ENUM values

Summary:`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    if (!response?.text) {
      throw new GeminiApiError("No text generated in response", 500);
    }

    const summary = response.text.trim();

    if (summary.length > maxLength + 100) {
      return summary.substring(0, maxLength) + "...";
    }

    return summary;
  } catch (error) {
    if (error instanceof GeminiApiError) {
      throw error;
    }

    throw new GeminiApiError("Failed to generate bill summary", 500, error);
  }
}
