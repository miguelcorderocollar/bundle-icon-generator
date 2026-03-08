import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { injectDocsBaseUrl, resolveDocsBaseUrl } from "@/src/utils/api-docs";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const filePath = path.join(process.cwd(), "docs", "api-reference.md");
    const markdown = await readFile(filePath, "utf-8");
    const baseUrl = resolveDocsBaseUrl({
      host:
        request.headers.get("x-forwarded-host") ?? request.headers.get("host"),
      forwardedProto: request.headers.get("x-forwarded-proto"),
    });
    const resolvedMarkdown = injectDocsBaseUrl(markdown, baseUrl);

    return new NextResponse(resolvedMarkdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to read API docs";
    return NextResponse.json(
      {
        error: "api_docs_read_failed",
        message,
      },
      { status: 500 }
    );
  }
}
