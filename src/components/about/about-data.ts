"use client";

export type ModalContent = {
  title: string;
  description: string;
  bullets?: string[];
};

export type AboutSection = {
  id: string;
  eyebrow: string;
  title: string;
  summary: string;
  panelTitle: string;
  panelItems: string[];
  modal: ModalContent;
  accent: string;
};

export const sections: AboutSection[] = [
  {
    id: "mission",
    eyebrow: "Mission",
    title: "Make congressional work legible.",
    summary:
      "Congress Do Your Job turns the week in Washington into a clear, source-linked briefing. We summarize bill actions, votes, hearings, and deadlines so you can see what moved forward, what stalled, and what is due next.",
    panelTitle: "Signals we track",
    panelItems: ["Bill movement", "Committee hearings", "Floor votes", "Deadlines + follow-through"],
    modal: {
      title: "How we summarize the week",
      description:
        "We pull from public sources and translate legislative activity into short, plain-English briefings. The goal is to make the work of Congress understandable in minutes, without asking you to read long bill texts or committee transcripts.",
      bullets: [
        "Clear status labels: moved, stalled, passed, or overdue.",
        "Primary sources linked wherever possible.",
        "Neutral language that focuses on outcomes, not outrage.",
      ],
    },
    accent: "bg-emerald-500",
  },
  {
    id: "method",
    eyebrow: "Method",
    title: "Show the work, not the noise.",
    summary:
      "We emphasize concrete actions instead of commentary: what hearings were held, which votes happened, and where deadlines were missed or met. That makes accountability specific and fair.",
    panelTitle: "What you can do",
    panelItems: ["See weekly progress", "Spot stalled timelines", "Track follow-up", "Reach your officials"],
    modal: {
      title: "Accountability with context",
      description:
        "Progress is only meaningful when paired with timing. We highlight looming deadlines and follow-up checkpoints so you can see whether Congress is acting on schedule or falling behind.",
      bullets: [
        "Deadlines are tracked alongside bill status.",
        "Follow-up reminders keep long-term items visible.",
        "Context helps avoid misreading a single vote.",
      ],
    },
    accent: "bg-amber-500",
  },
  {
    id: "civility",
    eyebrow: "Civility",
    title: "Accountability without the hostility.",
    summary:
      "We believe people are more persuasive when they stay specific, fair, and constructive. That tone invites response and keeps the civic conversation moving forward.",
    panelTitle: "Tone we encourage",
    panelItems: ["Specific requests", "Good-faith language", "Respectful follow-up", "Fact-based messages"],
    modal: {
      title: "Why tone matters",
      description:
        "Civility is not softness. It is a strategy that increases the chance of response and collaboration. We guide people toward messages that are direct, factual, and respectful.",
      bullets: [
        "Lead with what you want done, not who to blame.",
        "Use concrete facts and sources whenever possible.",
        "Follow up with gratitude when progress happens.",
      ],
    },
    accent: "bg-slate-700",
  },
];
