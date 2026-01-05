/**
 * Reusable preview placeholder component
 */

import { cn } from "@/lib/utils";

export interface PreviewPlaceholderProps {
  filename: string;
  dimensions: string;
  size?: "small" | "medium" | "large";
  className?: string;
}

const SIZE_CLASSES = {
  small: "max-w-[64px]",
  medium: "max-w-[128px]",
  large: "max-w-[320px]",
};

export function PreviewPlaceholder({
  filename,
  dimensions,
  size = "medium",
  className,
}: PreviewPlaceholderProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium font-mono">{filename}</h3>
        <span className="text-xs text-muted-foreground">{dimensions}</span>
      </div>
      <div
        className={cn(
          "flex aspect-square w-full items-center justify-center rounded-lg border-2 border-dashed bg-muted/20",
          SIZE_CLASSES[size]
        )}
      >
        <span className="text-xs text-muted-foreground">
          {size === "small" ? "SVG preview" : "Preview will appear here"}
        </span>
      </div>
    </div>
  );
}
