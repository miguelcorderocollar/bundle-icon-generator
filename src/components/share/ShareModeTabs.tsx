"use client";

import * as React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, PackagePlus } from "lucide-react";
import type { ShareMode } from "@/src/hooks/use-share-config";

export interface ShareModeTabsProps {
  /** Current share mode */
  mode: ShareMode;
  /** Callback when mode changes */
  onModeChange: (mode: ShareMode) => void;
}

/**
 * Tabs component for switching between restricted and import modes
 */
export function ShareModeTabs({ mode, onModeChange }: ShareModeTabsProps) {
  return (
    <>
      <Tabs
        value={mode}
        onValueChange={(value) => onModeChange(value as ShareMode)}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="restricted" className="gap-2">
            <Lock className="h-4 w-4" />
            Restricted Link
          </TabsTrigger>
          <TabsTrigger value="import" className="gap-2">
            <PackagePlus className="h-4 w-4" />
            Import Link
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Alert>
        <AlertDescription>
          {mode === "restricted" ? (
            <>
              <strong>Restricted Mode:</strong> Users will be locked to the
              presets you configure below. They cannot change colors or add
              their own presets.
            </>
          ) : (
            <>
              <strong>Import Mode:</strong> Users will receive the presets you
              configure below added to their collection. Existing presets are
              not overridden.
            </>
          )}
        </AlertDescription>
      </Alert>
    </>
  );
}
