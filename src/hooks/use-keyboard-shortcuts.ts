/**
 * Keyboard shortcuts hook for better UX
 */

import * as React from "react";

export interface KeyboardShortcuts {
  onSearchFocus?: () => void;
  onEscape?: () => void;
}

export function useKeyboardShortcuts({
  onSearchFocus,
  onEscape,
}: KeyboardShortcuts) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search on Ctrl+K (Cmd+K on Mac) - standard command palette shortcut
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key === "k" &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        onSearchFocus?.();
      }

      // Handle escape key
      if (e.key === "Escape") {
        onEscape?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSearchFocus, onEscape]);
}

