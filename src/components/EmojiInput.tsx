/**
 * Emoji input component for adding emojis to the icon collection
 */

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { extractEmoji, isValidEmoji } from "../utils/emoji-converter";
import { addEmoji } from "../utils/emoji-catalog";
import { Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmojiInputProps {
  onEmojiAdded?: (emojiId: string) => void;
  className?: string;
}

export function EmojiInput({ onEmojiAdded, className }: EmojiInputProps) {
  const [inputValue, setInputValue] = React.useState("");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setError(null);
    setSuccess(false);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData("text");
    const emoji = extractEmoji(pastedText);

    if (emoji) {
      e.preventDefault();
      setInputValue(emoji);
      handleAddEmoji(emoji);
    }
  };

  const handleAddEmoji = async (emoji?: string) => {
    const emojiToAdd = emoji || extractEmoji(inputValue);

    if (!emojiToAdd) {
      setError("Please enter or paste a valid emoji");
      return;
    }

    if (!isValidEmoji(emojiToAdd)) {
      setError("Invalid emoji. Please try a different one.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      const metadata = await addEmoji(emojiToAdd);

      setInputValue("");
      setSuccess(true);

      // Always call onEmojiAdded with the metadata ID (whether new or existing)
      // This allows the parent to select it and show it in preview
      onEmojiAdded?.(metadata.id);

      // Clear success message after a delay
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add emoji");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddEmoji();
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Paste an emoji here... (e.g., 🎨 🚀 ⭐)"
            value={inputValue}
            onChange={handleInputChange}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            disabled={isProcessing}
            className="text-lg"
            aria-label="Emoji input"
          />
          {inputValue && extractEmoji(inputValue) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-2xl pointer-events-none">
              {extractEmoji(inputValue)}
            </div>
          )}
        </div>
        <Button
          onClick={() => handleAddEmoji()}
          disabled={isProcessing || !extractEmoji(inputValue)}
          size="default"
        >
          <Plus className="size-4" />
          Add
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle2 className="size-4" />
          <AlertDescription>Emoji added successfully!</AlertDescription>
        </Alert>
      )}

      <p className="text-xs text-muted-foreground">
        Tip: You can paste emojis directly into the input field, or type them
        manually.
      </p>
    </div>
  );
}
