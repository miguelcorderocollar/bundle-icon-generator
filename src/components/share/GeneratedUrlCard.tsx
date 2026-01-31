"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link2, Copy, Check } from "lucide-react";
import type { ShareMode } from "@/src/hooks/use-share-config";

export interface GeneratedUrlCardProps {
  /** The generated URL */
  url: string;
  /** Current share mode */
  shareMode: ShareMode;
}

/**
 * Card component displaying the generated shareable URL
 */
export function GeneratedUrlCard({ url, shareMode }: GeneratedUrlCardProps) {
  const [copied, setCopied] = React.useState(false);

  // Copy URL to clipboard
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy URL:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          {shareMode === "restricted"
            ? "Generated Restricted URL"
            : "Generated Import URL"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={url}
            readOnly
            className="font-mono text-xs"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleCopyUrl}>
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{copied ? "Copied!" : "Copy URL"}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="text-xs text-muted-foreground">
          {shareMode === "restricted" ? (
            <>
              Share this URL with users to give them a restricted experience.
              They will only see the style presets and icon packs you&apos;ve
              configured above.
            </>
          ) : (
            <>
              Share this URL with users to add the configured presets to their
              collection. Their existing presets will not be overridden -
              duplicates will be renamed with &quot;(imported)&quot; suffix.
            </>
          )}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" asChild className="w-full">
            <a href={url} target="_blank" rel="noopener noreferrer">
              Open in New Tab
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
