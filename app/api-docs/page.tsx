import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { injectDocsBaseUrl, resolveDocsBaseUrl } from "@/src/utils/api-docs";

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
  const resolvedMarkdown = injectDocsBaseUrl(markdown, baseUrl);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-3xl font-semibold">Icon Generator API Docs</h1>
          <Link
            href="/api-docs.md"
            className="rounded border px-3 py-2 text-sm hover:bg-muted"
          >
            View raw markdown
          </Link>
        </div>

        <section className="mb-6 rounded-lg border bg-muted/30 p-5">
          <h2 className="text-xl font-semibold">What this API is for</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This API gives AI agents and scripts a predictable way to discover
            icons, configure style options, and generate final SVG assets that
            can be transformed into PNG/ICO externally.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Active base URL: <code>{baseUrl}</code>
          </p>
          <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
            <div className="rounded-md border bg-background p-3">
              <p className="font-medium">Discover</p>
              <p className="mt-1 text-muted-foreground">
                Search icons, list packs/categories, and inspect icon metadata.
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

        <pre className="overflow-x-auto rounded-lg border bg-muted p-5 text-sm leading-6 whitespace-pre-wrap">
          {resolvedMarkdown}
        </pre>
      </div>
    </main>
  );
}
