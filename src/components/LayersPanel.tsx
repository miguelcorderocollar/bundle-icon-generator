"use client";

/**
 * LayersPanel component for managing canvas layers
 * Compact design with icon-only buttons
 */

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Eye,
  EyeOff,
  Trash2,
  Type,
  Image as ImageIcon,
  Palette,
  ChevronUp,
  ChevronDown,
  Copy,
} from "lucide-react";
import type { CanvasLayer, CanvasEditorState } from "@/src/types/canvas";
import { isIconLayer, isImageLayer, isTextLayer } from "@/src/types/canvas";
import type { CanvasEditorActions } from "@/src/hooks/use-canvas-editor";
import { cn } from "@/lib/utils";

interface LayersPanelProps {
  state: CanvasEditorState;
  actions: CanvasEditorActions;
}

export function LayersPanel({ state, actions }: LayersPanelProps) {
  const [editingLayerId, setEditingLayerId] = React.useState<string | null>(
    null
  );
  const [editingName, setEditingName] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (editingLayerId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingLayerId]);

  const handleStartRename = (layer: CanvasLayer) => {
    setEditingLayerId(layer.id);
    setEditingName(layer.name);
  };

  const handleFinishRename = () => {
    if (editingLayerId && editingName.trim()) {
      actions.updateLayer(editingLayerId, { name: editingName.trim() });
    }
    setEditingLayerId(null);
    setEditingName("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleFinishRename();
    } else if (e.key === "Escape") {
      setEditingLayerId(null);
      setEditingName("");
    }
  };

  const getLayerIcon = (layer: CanvasLayer) => {
    if (isIconLayer(layer)) return <Palette className="size-3" />;
    if (isImageLayer(layer)) return <ImageIcon className="size-3" />;
    if (isTextLayer(layer)) return <Type className="size-3" />;
    return null;
  };

  // Reverse layers for display (top layer first in UI)
  const displayLayers = [...state.layers].reverse();

  if (displayLayers.length === 0) {
    return (
      <div className="border rounded-lg bg-background p-3">
        <p className="text-xs text-muted-foreground text-center">
          No layers yet. Click &quot;Add Layer&quot; to start.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-background">
      <div className="px-3 py-2 border-b flex items-center justify-between">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Layers ({state.layers.length})
        </h3>
      </div>

      <ScrollArea className="max-h-40">
        <div className="p-1">
          {displayLayers.map((layer, displayIndex) => {
            const actualIndex = state.layers.length - 1 - displayIndex;
            const isSelected = state.selectedLayerId === layer.id;
            const isEditing = editingLayerId === layer.id;

            return (
              <div
                key={layer.id}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded cursor-pointer transition-colors text-sm",
                  isSelected
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted",
                  !layer.visible && "opacity-50"
                )}
                onClick={() => actions.selectLayer(layer.id)}
              >
                {/* Layer type icon */}
                <span className="text-muted-foreground flex-shrink-0">
                  {getLayerIcon(layer)}
                </span>

                {/* Layer name */}
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <Input
                      ref={inputRef}
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={handleFinishRename}
                      onKeyDown={handleKeyDown}
                      className="h-5 text-xs py-0 px-1"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span
                      className="text-xs truncate block"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleStartRename(layer);
                      }}
                      title={layer.name}
                    >
                      {layer.name}
                    </span>
                  )}
                </div>

                {/* Layer controls - icon only */}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <TooltipProvider delayDuration={300}>
                    {/* Move up */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-5"
                          onClick={(e) => {
                            e.stopPropagation();
                            actions.bringForward(layer.id);
                          }}
                          disabled={actualIndex === state.layers.length - 1}
                        >
                          <ChevronUp className="size-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">Bring forward</TooltipContent>
                    </Tooltip>

                    {/* Move down */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-5"
                          onClick={(e) => {
                            e.stopPropagation();
                            actions.sendBackward(layer.id);
                          }}
                          disabled={actualIndex === 0}
                        >
                          <ChevronDown className="size-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">Send backward</TooltipContent>
                    </Tooltip>

                    {/* Duplicate */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-5"
                          onClick={(e) => {
                            e.stopPropagation();
                            actions.duplicateLayer(layer.id);
                          }}
                        >
                          <Copy className="size-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">Duplicate</TooltipContent>
                    </Tooltip>

                    {/* Visibility */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-5"
                          onClick={(e) => {
                            e.stopPropagation();
                            actions.updateLayer(layer.id, {
                              visible: !layer.visible,
                            });
                          }}
                        >
                          {layer.visible ? (
                            <Eye className="size-3" />
                          ) : (
                            <EyeOff className="size-3" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        {layer.visible ? "Hide" : "Show"}
                      </TooltipContent>
                    </Tooltip>

                    {/* Delete */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-5 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            actions.removeLayer(layer.id);
                          }}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">Delete</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
