"use client";

import { useEffect } from "react";

/**
 * Global error boundary — catches errors thrown from the root layout itself.
 * Must include its own <html> and <body> since the layout may have failed.
 * Keep this minimal and dependency-free to maximize catch probability.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Global error boundary]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #e4f0f9 0%, #e4f0f9 50%, #fde3e0 100%)",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#94a3b8",
              marginBottom: 12,
            }}
          >
            Congress Do Your Job
          </p>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#0f172a",
              marginBottom: 16,
              letterSpacing: "-0.01em",
            }}
          >
            Something went wrong.
          </h1>
          <p style={{ fontSize: 15, color: "#475569", lineHeight: 1.7, marginBottom: 32 }}>
            We encountered an unexpected error. Our team has been notified.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={reset}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "#0f172a",
                color: "#fff",
                border: "none",
                borderRadius: 9999,
                padding: "12px 24px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "#fff",
                color: "#1e293b",
                border: "1px solid #e2e8f0",
                borderRadius: 9999,
                padding: "12px 24px",
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Back to dashboard
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
