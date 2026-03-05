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

export interface BillMetadata {
  chamber?: string;
  policyArea?: string;
  latestAction?: string;
  introducedDate?: string;
  sponsors?: Array<{ fullName: string; state: string }>;
}

export interface SummarizeBillOptions {
  billText: string;
  billTitle: string;
  maxLength?: number;
  metadata?: BillMetadata;
}

export async function summarizeBill({
  billText,
  billTitle,
  maxLength = 300,
  metadata,
}: SummarizeBillOptions): Promise<string> {
  const approvedSources = Object.values(APPROVED_SOURCES_ENUM).join(", ");

  const metadataSection =
    metadata && Object.values(metadata).some(Boolean)
      ? `
Bill Metadata:
${metadata.chamber ? `- Chamber: ${metadata.chamber}` : ""}
${metadata.policyArea ? `- Policy Area: ${metadata.policyArea}` : ""}
${metadata.introducedDate ? `- Introduced: ${metadata.introducedDate}` : ""}
${metadata.latestAction ? `- Latest Action: ${metadata.latestAction}` : ""}
${metadata.sponsors?.length ? `- Sponsors: ${metadata.sponsors.map((s) => `${s.fullName} (${s.state})`).join(", ")}` : ""}
`
      : "";

  try {
    const prompt = `You are summarizing U.S. congressional legislation for a non-partisan civic engagement platform.

Bill Title: ${billTitle}
${metadataSection}
Official Bill Text / Summary:
${billText}

Instructions:
- Write a concise, plain-English summary in 3-5 sentences (max ${maxLength} characters)
- Focus on WHAT the bill does, not WHY or political motivations
- Use narrative voice and professional prose (clear, precise, like NPR reporting)
- Avoid jargon, partisan framing, and superlatives
- Start with the core action (e.g., "This bill establishes...", "This bill requires...", "This bill amends...")
- Be factual and neutral
- If the provided text is sparse, use the metadata above and search for context from these approved sources: ${approvedSources}

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
