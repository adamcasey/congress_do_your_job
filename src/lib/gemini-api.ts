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
  url?: string;
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

export interface DigestContent {
  newsItems: CongressNewsItem[];
  introSummary: string;
}

/**
 * Single Gemini call (with Google Search grounding) that returns both the
 * three "This Week in Congress" news items AND the editorial intro paragraph.
 * Combining them into one request halves the API quota consumption.
 */
export async function generateCongressDigestContent(
  weekOf: string,
  featuredBills: Array<{ title: string; summary: string; type: string; number: string }>,
): Promise<DigestContent> {
  const billContext =
    featuredBills.length > 0
      ? featuredBills.map((b) => `- ${b.type} ${b.number}: ${b.title}\n  ${b.summary}`).join("\n")
      : "No featured bills this week.";

  const prompt = `You are writing content for the weekly email from CongressDoYourJob.com — a non-partisan civic platform with the tagline "Less theater. More legislation."

Use your web search tool to research what happened in the U.S. Congress during the week of ${weekOf}.

Featured bills that moved this week (for additional context):
${billContext}

Your task is to produce TWO things:

1. THREE news items — the most significant things that happened in or around Congress this week (votes, bills advancing, hearings, deadlines, procedural drama). For each:
   - A short punchy heading (5-9 words, slightly irreverent — humor from absurdity, never from partisan shots)
   - A body of 3-5 factual sentences in plain, mildly witty English
   - The best publicly accessible URL for the story (Congress.gov, senate.gov, house.gov, or a well-known news outlet; empty string if none)

2. ONE intro paragraph — 4-5 sentences about the SINGLE most important thing that happened in or around Congress this week. Tone: Josh Barro / Ben Dreyfuss / Megan McArdle. Smart, conversational, slightly wry. Begin DIRECTLY with substance — no "Hey", no "This week in Congress". Write as if opening a letter to a smart, busy friend who doesn't follow politics obsessively.

Hard rules for ALL content:
- Never mention political parties, affiliations, or ideology
- No outrage, no tribalism, no partisan framing
- Do NOT use these words: ${BANNED_WORDS}

Return ONLY valid JSON — no markdown, no code fences, nothing else:
{
  "newsItems": [
    { "heading": "...", "body": "...", "url": "https://..." },
    { "heading": "...", "body": "...", "url": "https://..." },
    { "heading": "...", "body": "...", "url": "https://..." }
  ],
  "introSummary": "..."
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    if (!response?.text) {
      throw new GeminiApiError("No text in digest content response", 500);
    }

    const raw = response.text.trim().replace(/^```json\s*/i, "").replace(/```\s*$/, "");
    const parsed = JSON.parse(raw) as DigestContent;

    if (!Array.isArray(parsed.newsItems) || typeof parsed.introSummary !== "string") {
      throw new GeminiApiError("Unexpected digest content response shape", 500);
    }

    return {
      newsItems: parsed.newsItems.slice(0, 3),
      introSummary: parsed.introSummary.trim(),
    };
  } catch (error) {
    if (error instanceof GeminiApiError) throw error;
    throw new GeminiApiError("Failed to generate digest content", 500, error);
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
