import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { injectDocsBaseUrl, resolveDocsBaseUrl } from "@/src/utils/api-docs";
import { CopyAgentPromptButton } from "./CopyAgentPromptButton";

export const metadata: Metadata = {
  title: "API Docs",
  description: "Icon Generator API reference for AI agents and scripts.",
};

async function loadApiReferenceMarkdown(): Promise<string> {
  const filePath = path.join(process.cwd(), "docs", "api-reference.md");
  return readFile(filePath, "utf-8");
}

export default async function ApiDocsPage() {
  const markdown = await loadApiReferenceMarkdown();
  const requestHeaders = await headers();
  const baseUrl = resolveDocsBaseUrl({
    host: requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"),
    forwardedProto: requestHeaders.get("x-forwarded-proto"),
  });
  const docsUrl = `${baseUrl}/api-docs.md`;
  const resolvedMarkdown = injectDocsBaseUrl(markdown, baseUrl);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b bg-background px-6 py-4">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                Back to Generator
              </Link>
            </Button>
            <span className="text-muted-foreground">|</span>
            <h1 className="text-lg font-semibold">API Docs</h1>
          </div>

          <div className="flex items-center gap-2">
            <CopyAgentPromptButton baseUrl={baseUrl} docsUrl={docsUrl} />
            <Button variant="outline" size="sm" asChild>
              <Link href="/api-docs.md">
                <FileText className="h-4 w-4" />
                Raw markdown
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto w-full max-w-5xl px-6 py-8">
          <section className="mb-8 rounded-lg border bg-muted/30 p-6">
            <h2 className="text-xl font-semibold">
              Icon Generator API for AI Agents
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Use this API to search thousands of icons, pick colors and
              gradients, and generate production-ready SVG assets from any
              script, CLI, or AI agent. Convert SVGs to PNG/ICO externally with
              your preferred tooling.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Base URL: <code className="text-foreground">{baseUrl}</code>
            </p>
            <div className="mt-5 grid gap-3 text-sm md:grid-cols-3">
              <div className="rounded-md border bg-background p-3">
                <p className="font-medium">Discover</p>
                <p className="mt-1 text-muted-foreground">
                  Search icons, list packs/categories, and inspect icon
                  metadata.
                </p>
              </div>
              <div className="rounded-md border bg-background p-3">
                <p className="font-medium">Generate</p>
                <p className="mt-1 text-muted-foreground">
                  Produce SVG with solid/gradient backgrounds, color, and scale
                  controls.
                </p>
              </div>
              <div className="rounded-md border bg-background p-3">
                <p className="font-medium">Integrate</p>
                <p className="mt-1 text-muted-foreground">
                  Use HTTP, curl, or agent workflows; consume JSON or raw SVG.
                </p>
              </div>
            </div>
          </section>

          <pre className="overflow-x-auto rounded-lg border bg-muted p-6 text-sm leading-6 whitespace-pre-wrap">
            {resolvedMarkdown}
          </pre>
        </div>
      </main>
    </div>
  );
}
