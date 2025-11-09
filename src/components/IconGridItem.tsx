/**
 * Individual icon grid item component with selection state
 */

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface IconGridItemProps {
  id: string;
  label: string;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function IconGridItem({
  id,
  label,
  isSelected = false,
  onClick,
  className,
  style,
}: IconGridItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={style}
      className={cn(
        "group relative flex aspect-square items-center justify-center rounded-md border-2 transition-all",
        "bg-muted/50 hover:bg-muted hover:border-primary/50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isSelected && "border-primary bg-primary/10 shadow-sm",
        className
      )}
      aria-label={`Select icon: ${label}`}
    >
      <span className="text-xs text-muted-foreground group-hover:text-foreground">
        {label}
      </span>
      {isSelected && (
        <div className="absolute right-1 top-1 rounded-full bg-primary p-0.5">
          <Check className="size-2.5 text-primary-foreground" />
        </div>
      )}
    </button>
  );
}

