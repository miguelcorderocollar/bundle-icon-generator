"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CustomSvgInputProps {
  value?: string;
  onChange?: (svg: string) => void;
  onSelect?: (svg: string, allowColorOverride?: boolean) => void;
  className?: string;
}

export function CustomSvgInput({
  value = "",
  onChange,
  onSelect,
  className,
}: CustomSvgInputProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [localValue, setLocalValue] = React.useState(value);
  const [error, setError] = React.useState<string | null>(null);
  const [allowColorOverride, setAllowColorOverride] = React.useState(false);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    setError(null);
    onChange?.(newValue);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.includes("svg") && !file.name.endsWith(".svg")) {
      setError("Please select an SVG file");
      return;
    }

    try {
      const text = await file.text();

      // Basic SVG validation - check for SVG tag (allow whitespace/newlines)
      const trimmedText = text.trim();
      if (!trimmedText.match(/<svg[\s\S]*<\/svg>/i)) {
        setError(
          "Invalid SVG file. Please ensure it contains valid SVG markup."
        );
        return;
      }

      setLocalValue(text);
      setError(null);
      onChange?.(text);
      onSelect?.(text, allowColorOverride);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError("Failed to read file. Please try again.");
      console.error("Error reading SVG file:", err);
    }
  };

  const handlePaste = () => {
    const trimmedValue = localValue.trim();
    if (trimmedValue) {
      // Basic SVG validation - check for SVG tag (allow whitespace/newlines)
      if (!trimmedValue.match(/<svg[\s\S]*<\/svg>/i)) {
        setError("Invalid SVG. Please ensure it contains valid SVG markup.");
        return;
      }
      setError(null);
      onSelect?.(trimmedValue, allowColorOverride);
    }
  };

  const handleClear = () => {
    setLocalValue("");
    setError(null);
    onChange?.("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Check if the current value is valid SVG
  const isValidSvg = React.useMemo(() => {
    if (!localValue.trim()) return false;
    return /<svg[\s\S]*<\/svg>/i.test(localValue.trim());
  }, [localValue]);

  return (
    <div
      className={cn(
        "flex flex-col h-full min-h-0 space-y-4 overflow-y-auto",
        className
      )}
    >
      <div className="space-y-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <Label htmlFor="svg-code">SVG Code</Label>
          {localValue && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-7 text-xs"
            >
              <X className="mr-1 size-3" />
              Clear
            </Button>
          )}
        </div>
        <Textarea
          id="svg-code"
          placeholder="Paste your SVG code here..."
          value={localValue}
          onChange={handleTextareaChange}
          className="font-mono text-sm min-h-[200px] resize-none"
        />
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {localValue && !isValidSvg && !error && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>Enter valid SVG markup</AlertDescription>
          </Alert>
        )}
        {localValue && isValidSvg && !error && (
          <>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="allow-color-override"
                checked={allowColorOverride}
                onCheckedChange={(checked) =>
                  setAllowColorOverride(checked === true)
                }
              />
              <Label
                htmlFor="allow-color-override"
                className="text-sm font-normal cursor-pointer"
              >
                Allow color customization
              </Label>
            </div>
            <Button
              type="button"
              onClick={handlePaste}
              className="w-full"
              size="sm"
            >
              Use This SVG
            </Button>
          </>
        )}
      </div>

      <div className="space-y-2 flex-shrink-0">
        <Label htmlFor="svg-upload">Or Upload SVG File</Label>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            id="svg-upload"
            accept=".svg,image/svg+xml"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
            size="sm"
          >
            <Upload className="mr-2 size-4" />
            Choose File
          </Button>
        </div>
      </div>
    </div>
  );
}
