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

export interface CongressNewsItem {
  heading: string;
  body: string;
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

const BANNED_WORDS =
  "delve, leverage, utilize, paradigm, synergy, robust, game-changer, streamline, transformative, pivotal, groundbreaking, innovative, empower, holistic, navigate, landscape, realm, foster, facilitate, harness, meticulous, commendable, testament, notably, straightforward, cutting-edge, seamless";

export async function generateCongressNewsItems(weekOf: string): Promise<CongressNewsItem[]> {
  const prompt = `You are a witty, non-partisan writer for CongressDoYourJob.com — a civic platform with the tagline "Less theater. More legislation."

Search for the top 3 most significant things that happened in the U.S. Congress during the week of ${weekOf}.

For each event write:
1. A short, comical paragraph heading (5-9 words, punchy, slightly irreverent — the humor comes from the absurdity of the situation, never from partisan shots)
2. A body of 3-5 sentences: factual, plain English, mildly witty — think NPR if NPR loosened its tie slightly

Hard rules:
- Never mention political parties, affiliations, or ideology
- No outrage, no tribalism, no partisan framing
- Focus only on what actually happened: votes taken, bills passed, hearings held, deadlines missed, procedural drama
- Do NOT use any of these words: ${BANNED_WORDS}

Return ONLY a valid JSON array — no markdown, no code fences, nothing else:
[
  { "heading": "...", "body": "..." },
  { "heading": "...", "body": "..." },
  { "heading": "...", "body": "..." }
]`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    if (!response?.text) {
      throw new GeminiApiError("No text in news items response", 500);
    }

    const raw = response.text.trim().replace(/^```json\s*/i, "").replace(/```\s*$/, "");
    const parsed = JSON.parse(raw) as CongressNewsItem[];

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new GeminiApiError("Unexpected news items response shape", 500);
    }

    return parsed.slice(0, 3);
  } catch (error) {
    if (error instanceof GeminiApiError) throw error;
    throw new GeminiApiError("Failed to generate congress news items", 500, error);
  }
}

export async function summarizeBill({
  billText,
  billTitle,
  maxLength = 800,
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
    const prompt = `You are summarizing U.S. congressional legislation for a non-partisan civic engagement platform called CongressDoYourJob.com.

Bill Title: ${billTitle}
${metadataSection}
Official Bill Text / Summary:
${billText}

Instructions:
- Write exactly 3-4 complete sentences in plain English that a typical American can understand
- BEGIN your response with "This bill" or "This legislation" — the very first word must be "This"
- Sentence 1: State the core action of the bill (what it does, not its name)
- Sentence 2: Explain the primary mechanism or requirement the bill creates (who must do what, or what changes)
- Sentence 3: Describe the practical impact on people, agencies, or the country
- Sentence 4 (optional): Add a relevant detail such as funding amounts, eligibility criteria, or key exceptions if meaningful
- DO NOT start with the bill's name, title, or acronym — go straight to what the bill does
- DO NOT include political opinions, party mentions, or editorial judgment
- DO NOT use jargon without explanation
- If the official text is sparse or missing, draw on the metadata and these approved sources for context: ${approvedSources}

Summary:`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    if (!response?.text) {
      throw new GeminiApiError("No text generated in response", 500);
    }

    const summary = response.text.trim();

    // Allow up to 1.5x maxLength before hard-truncating to avoid mid-sentence cuts
    if (summary.length > maxLength * 1.5) {
      const truncated = summary.substring(0, maxLength);
      const lastPeriod = truncated.lastIndexOf(".");
      return lastPeriod > maxLength * 0.5 ? truncated.substring(0, lastPeriod + 1) : truncated + "...";
    }

    return summary;
  } catch (error) {
    if (error instanceof GeminiApiError) {
      throw error;
    }

    throw new GeminiApiError("Failed to generate bill summary", 500, error);
  }
}
