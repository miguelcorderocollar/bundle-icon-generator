"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CopyAgentPromptButtonProps {
  baseUrl: string;
  docsUrl: string;
}

function buildPrompt(baseUrl: string, docsUrl: string): string {
  return [
    "Use the Icon Generator API to search icons and generate SVG assets.",
    `Base URL: ${baseUrl}`,
    `Full API reference (raw markdown): ${docsUrl}`,
    "",
    "Suggested flow:",
    "1) Search icons — GET /api/icons?q=<query>",
    "2) Get icon details — GET /api/icons/<id>",
    "3) Generate SVG — POST /api/generate",
    "",
    "Read the docs URL above for request/response schemas and examples.",
  ].join("\n");
}

export function CopyAgentPromptButton({
  baseUrl,
  docsUrl,
}: CopyAgentPromptButtonProps) {
  const [status, setStatus] = React.useState<"idle" | "copied" | "error">(
    "idle"
  );

  const copyToClipboard = React.useCallback(async () => {
    const text = buildPrompt(baseUrl, docsUrl);

    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
    } catch {
      setStatus("error");
    }

    window.setTimeout(() => setStatus("idle"), 2200);
  }, [baseUrl, docsUrl]);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={copyToClipboard}
      aria-label="Copy base agent prompt"
      title="Copy base agent prompt"
    >
      {status === "copied" ? (
        <>
          <Check className="h-4 w-4" />
          Copied
        </>
      ) : status === "error" ? (
        "Copy failed"
      ) : (
        <>
          <Copy className="h-4 w-4" />
          Copy agent prompt
        </>
      )}
    </Button>
  );
}
