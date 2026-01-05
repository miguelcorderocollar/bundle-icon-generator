"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

export interface MultiSelectOption {
  label: string;
  value: string;
  description?: string;
  /** Whether this option is disabled */
  disabled?: boolean;
  /** Tooltip to show when disabled */
  disabledReason?: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options...",
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleUnselect = (value: string) => {
    onChange(selected.filter((s) => s !== value));
  };

  const handleToggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((s) => s !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-auto min-h-10 w-full justify-between text-left font-normal",
            className
          )}
        >
          <div className="flex flex-wrap gap-1">
            {selected.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selected.map((value) => {
                const option = options.find((opt) => opt.value === value);
                return (
                  <Badge
                    key={value}
                    variant="secondary"
                    className="mr-1 mb-1 gap-1 pr-0"
                  >
                    <span>{option?.label}</span>
                    <span
                      role="button"
                      tabIndex={0}
                      className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer hover:bg-secondary/80 p-0.5"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          handleUnselect(value);
                        }
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleUnselect(value);
                      }}
                      aria-label={`Remove ${option?.label}`}
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </span>
                  </Badge>
                );
              })
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <div className="max-h-[300px] overflow-y-auto p-2">
          {options.map((option) => {
            const isDisabled = option.disabled ?? false;
            const optionContent = (
              <div
                key={option.value}
                className={cn(
                  "flex items-start space-x-2 rounded-sm px-2 py-1.5",
                  isDisabled
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-accent"
                )}
              >
                <Checkbox
                  id={option.value}
                  checked={selected.includes(option.value)}
                  onCheckedChange={() =>
                    !isDisabled && handleToggle(option.value)
                  }
                  disabled={isDisabled}
                  className="mt-0.5"
                />
                <label
                  htmlFor={option.value}
                  className={cn(
                    "flex-1 text-sm",
                    isDisabled ? "cursor-not-allowed" : "cursor-pointer"
                  )}
                >
                  <div className="font-medium leading-none">{option.label}</div>
                  {option.description && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {option.description}
                    </div>
                  )}
                  {isDisabled && option.disabledReason && (
                    <div className="mt-1 text-xs text-destructive/70">
                      {option.disabledReason}
                    </div>
                  )}
                </label>
                {selected.includes(option.value) && (
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                )}
              </div>
            );
            return (
              <React.Fragment key={option.value}>
                {optionContent}
              </React.Fragment>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
