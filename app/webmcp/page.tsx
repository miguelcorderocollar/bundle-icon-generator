"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CircleAlert,
  Code2,
  ExternalLink,
  Play,
  Sparkles,
  Terminal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  createWebMcpTools,
  getDocumentModelContext,
  registerWebMcpTools,
  type GeneratedIconSvgResult,
  type WebMcpRegistration,
  type WebMcpToolDefinition,
} from "@/src/utils/webmcp";

type WebMcpStatus = "checking" | "ready" | "unavailable" | "error";

const webMcpTools = createWebMcpTools();
const generateTool = webMcpTools.find(
  (tool) => tool.name === "generate_icon_svg"
);

const defaultGenerationInput = {
  iconId: "feather-star",
  backgroundColor: "#17494d",
  iconColor: "#ffffff",
  size: 128,
  padding: 8,
};

function ToolRow({ tool }: { tool: WebMcpToolDefinition }) {
  return (
    <div className="flex items-start gap-3 border-t border-white/10 py-4 first:border-t-0 first:pt-0 last:pb-0">
      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-cyan-300/10 text-cyan-200">
        <Code2 className="size-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <code className="text-sm font-semibold text-white">{tool.name}</code>
          <Badge className="border-cyan-200/20 bg-cyan-200/10 text-[10px] text-cyan-100">
            read-only
          </Badge>
        </div>
        <p className="mt-1 text-xs leading-5 text-slate-400">
          {tool.description}
        </p>
      </div>
    </div>
  );
}

function StatusMessage({ status }: { status: WebMcpStatus }) {
  if (status === "ready") {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-emerald-300">
        <span className="size-2 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.9)]" />
        WebMCP detected
      </span>
    );
  }

  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-rose-300">
        <CircleAlert className="size-4" />
        Registration failed
      </span>
    );
  }

  if (status === "unavailable") {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-amber-200">
        <CircleAlert className="size-4" />
        WebMCP is not available in this browser
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 text-sm text-slate-300">
      <span className="size-2 animate-pulse rounded-full bg-slate-300" />
      Checking browser support...
    </span>
  );
}

export default function WebMcpPage() {
  const [status, setStatus] = React.useState<WebMcpStatus>("checking");
  const [registration, setRegistration] =
    React.useState<WebMcpRegistration | null>(null);
  const [query, setQuery] = React.useState(defaultGenerationInput.iconId);
  const [result, setResult] = React.useState<GeneratedIconSvgResult | null>(
    null
  );
  const [isRunning, setIsRunning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let disposed = false;
    let activeRegistration: WebMcpRegistration | null = null;

    async function registerTools() {
      const modelContext = getDocumentModelContext();
      if (!modelContext) {
        setStatus("unavailable");
        return;
      }

      try {
        const nextRegistration = await registerWebMcpTools(modelContext);
        if (disposed) {
          nextRegistration.dispose();
          return;
        }
        activeRegistration = nextRegistration;
        setRegistration(nextRegistration);
        setStatus("ready");
      } catch {
        if (!disposed) {
          setStatus("error");
        }
      }
    }

    void registerTools();

    return () => {
      disposed = true;
      activeRegistration?.dispose();
    };
  }, []);

  async function runGenerationTool() {
    if (!generateTool) {
      setError("The generation tool is not registered.");
      return;
    }

    setIsRunning(true);
    setError(null);
    try {
      const toolResult = await generateTool.execute(
        { ...defaultGenerationInput, iconId: query.trim() },
        { signal: new AbortController().signal }
      );
      setResult(toolResult as GeneratedIconSvgResult);
    } catch (toolError) {
      setResult(null);
      setError(
        toolError instanceof Error ? toolError.message : "Tool call failed."
      );
    } finally {
      setIsRunning(false);
    }
  }

  const previewUrl = result
    ? "data:image/svg+xml;charset=utf-8," + encodeURIComponent(result.svg)
    : null;

  return (
    <main className="min-h-screen overflow-hidden bg-[#071c24] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(33,164,165,0.22),transparent_32%),radial-gradient(circle_at_90%_85%,rgba(243,171,73,0.14),transparent_30%)]" />
      <div className="relative mx-auto max-w-6xl px-5 py-6 md:px-10 md:py-10">
        <nav className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="size-4" />
            Icon generator
          </Link>
          <Badge className="border-amber-200/25 bg-amber-200/10 px-3 py-1 text-[10px] tracking-[0.18em] text-amber-100 uppercase">
            WebMCP demo
          </Badge>
        </nav>

        <section className="grid gap-8 pb-12 pt-16 md:grid-cols-[1.2fr_0.8fr] md:items-end md:pt-24">
          <div>
            <p className="mb-5 flex items-center gap-2 text-xs font-medium tracking-[0.24em] text-cyan-200 uppercase">
              <Sparkles className="size-4" />
              Tools in the tab
            </p>
            <h1 className="max-w-3xl text-4xl leading-[1.05] font-semibold tracking-[-0.04em] text-white md:text-7xl">
              Give an agent the controls, not a screenshot puzzle.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-400 md:text-lg">
              This page registers three read-only tools with the browser&apos;s
              WebMCP model context. The tools call the same icon catalog and
              renderer as the app, so an agent can search, inspect, and generate
              an SVG while you keep the page in view.
            </p>
          </div>

          <Card className="border-white/10 bg-white/[0.06] text-white shadow-2xl shadow-cyan-950/30 backdrop-blur">
            <CardHeader className="gap-4">
              <div className="flex items-center justify-between">
                <CardTitle className="font-mono text-sm font-medium tracking-tight">
                  document.modelContext
                </CardTitle>
                <Terminal className="size-4 text-cyan-200" />
              </div>
              <CardDescription className="text-slate-400">
                The top-level document is the tool owner.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-white/10 bg-black/20 px-4 py-3">
                <StatusMessage status={status} />
                {registration ? (
                  <p className="mt-2 text-xs text-slate-500">
                    {registration.toolNames.length} tools registered for this
                    page
                  </p>
                ) : null}
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-500">
                ChatGPT site tools and compatible browser agents can discover
                these definitions when WebMCP is enabled.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-5 md:grid-cols-[0.85fr_1.15fr]">
          <Card className="border-white/10 bg-white/[0.055] text-white shadow-xl shadow-black/10 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg">Registered tools</CardTitle>
              <CardDescription className="text-slate-400">
                Narrow inputs. No downloads. No page mutations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                {webMcpTools.map((tool) => (
                  <ToolRow key={tool.name} tool={tool} />
                ))}
              </div>
              <div className="mt-7 rounded-lg border border-cyan-200/10 bg-cyan-200/[0.05] p-4">
                <p className="font-mono text-xs leading-6 text-cyan-100/80">
                  {'registerTool({ name: "generate_icon_svg" })'}
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  SVG responses are marked as untrusted content so a calling
                  agent can handle them with care.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200/15 bg-[#102d34] text-white shadow-xl shadow-black/20">
            <CardHeader className="border-b border-white/10">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">
                    Try the generation tool
                  </CardTitle>
                  <CardDescription className="mt-2 text-slate-400">
                    This button invokes the exact handler an agent would call.
                  </CardDescription>
                </div>
                <div className="hidden rounded-full border border-amber-200/20 bg-amber-200/10 p-2 text-amber-100 sm:block">
                  <Play className="size-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div className="space-y-2">
                <label
                  htmlFor="webmcp-icon-id"
                  className="text-xs font-medium text-slate-300"
                >
                  Icon ID
                </label>
                <div className="flex gap-2">
                  <Input
                    id="webmcp-icon-id"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="border-white/10 bg-black/20 text-white placeholder:text-slate-600"
                    placeholder="feather-star"
                  />
                  <Button
                    onClick={runGenerationTool}
                    disabled={isRunning || !query.trim()}
                    className="shrink-0 bg-amber-200 text-[#17262b] hover:bg-amber-100"
                  >
                    {isRunning ? "Running..." : "Run tool"}
                  </Button>
                </div>
              </div>

              {error ? (
                <div className="rounded-lg border border-rose-300/20 bg-rose-300/10 p-4 text-sm text-rose-100">
                  {error}
                </div>
              ) : null}

              <div className="grid min-h-72 place-items-center overflow-hidden rounded-xl border border-white/10 bg-[linear-gradient(135deg,#17494d,#0b252d)] p-8">
                {previewUrl ? (
                  <div className="grid size-48 place-items-center rounded-2xl bg-white/10 p-4 shadow-2xl shadow-black/20">
                    <Image
                      src={previewUrl}
                      alt={result?.icon.name ?? "Generated icon"}
                      width={192}
                      height={192}
                      unoptimized
                      className="size-full"
                    />
                  </div>
                ) : (
                  <div className="max-w-xs text-center">
                    <div className="mx-auto mb-4 grid size-12 place-items-center rounded-xl border border-dashed border-white/20 text-slate-500">
                      <Code2 className="size-5" />
                    </div>
                    <p className="text-sm text-slate-400">
                      Run the tool to render an SVG from the bundled catalog.
                    </p>
                  </div>
                )}
              </div>

              {result ? (
                <div className="grid gap-3 text-xs text-slate-400 sm:grid-cols-3">
                  <div>
                    <p className="text-slate-600 uppercase">Icon</p>
                    <p className="mt-1 font-mono text-slate-200">
                      {result.icon.id}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 uppercase">Output</p>
                    <p className="mt-1 font-mono text-slate-200">
                      {result.settings.outputSize}px SVG
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 uppercase">Contract</p>
                    <p className="mt-1 inline-flex items-center gap-1 font-mono text-emerald-300">
                      <Check className="size-3" />v{result.apiVersion}
                    </p>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </section>

        <section className="mt-5 grid gap-5 md:grid-cols-2">
          <Card className="border-white/10 bg-black/15 text-white">
            <CardHeader>
              <CardTitle className="text-base">Ask ChatGPT to use it</CardTitle>
              <CardDescription className="text-slate-400">
                Open this deployed route in the built-in browser, then ask for a
                specific icon search or SVG generation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-white/10 bg-black/20 p-4 font-mono text-xs leading-6 text-slate-300">
                &quot;Use the site tools to find a Feather star icon and
                generate it with a teal background.&quot;
              </div>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-black/15 text-white">
            <CardHeader>
              <CardTitle className="text-base">
                Read the implementation
              </CardTitle>
              <CardDescription className="text-slate-400">
                The demo is intentionally small so the tool contract is easy to
                inspect in a draft PR.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  asChild
                  className="border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  <a
                    href="https://github.com/miguelcorderocollar/bundle-icon-generator/blob/codex/webmcp-demo/src/utils/webmcp.ts"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="size-4" />
                    Tool source
                  </a>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  <a
                    href="https://learn.chatgpt.com/docs/webmcp"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    ChatGPT guide
                    <ExternalLink className="size-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
