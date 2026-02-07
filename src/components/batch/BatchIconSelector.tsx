"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, FileImage } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIconSearch } from "@/src/hooks/use-icon-search";
import type { IconMetadata } from "@/src/types/icon";
import type { BatchIconSource, UploadedAsset } from "@/src/types/batch";
import { ICON_PACKS, type IconPack } from "@/src/constants/app";

export interface BatchIconSelectorProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Called when dialog should close */
  onOpenChange: (open: boolean) => void;
  /** Current icon source for initial tab */
  currentSource?: BatchIconSource;
  /** Uploaded assets to show in the "upload" tab */
  uploadedAssets: UploadedAsset[];
  /** Called when an icon is selected */
  onSelect: (source: BatchIconSource, iconName: string, iconId: string) => void;
}

interface TabConfig {
  value: BatchIconSource;
  label: string;
  pack: IconPack | "upload";
}

const TABS: TabConfig[] = [
  { value: "zendesk-garden", label: "Garden", pack: ICON_PACKS.GARDEN },
  { value: "feather", label: "Feather", pack: ICON_PACKS.FEATHER },
  { value: "remixicon", label: "Remix", pack: ICON_PACKS.REMIXICON },
  { value: "emoji", label: "Emoji", pack: ICON_PACKS.EMOJI },
  { value: "upload", label: "Uploaded", pack: "upload" },
];

/**
 * Icon grid item for displaying a single icon
 */
function IconGridItem({
  icon,
  isSelected,
  onSelect,
}: {
  icon: IconMetadata;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "size-12 rounded-md border flex items-center justify-center",
        "hover:border-primary hover:bg-primary/5 transition-colors",
        isSelected && "border-primary bg-primary/10"
      )}
      title={icon.name}
    >
      {icon.svg ? (
        <div
          className="size-8"
          dangerouslySetInnerHTML={{ __html: icon.svg }}
        />
      ) : (
        <span className="text-2xl">{icon.name}</span>
      )}
    </button>
  );
}

/**
 * Uploaded asset grid item
 */
function UploadedAssetItem({
  asset,
  isSelected,
  onSelect,
}: {
  asset: UploadedAsset;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "size-12 rounded-md border flex items-center justify-center overflow-hidden",
        "hover:border-primary hover:bg-primary/5 transition-colors",
        isSelected && "border-primary bg-primary/10"
      )}
      title={asset.name}
    >
      {asset.type === "svg" ? (
        <div
          className="size-8"
          dangerouslySetInnerHTML={{ __html: asset.svgContent || "" }}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={asset.dataUrl}
          alt={asset.name}
          className="size-8 object-contain"
        />
      )}
    </button>
  );
}

export function BatchIconSelector({
  open,
  onOpenChange,
  currentSource,
  uploadedAssets,
  onSelect,
}: BatchIconSelectorProps) {
  const [activeTab, setActiveTab] = React.useState<BatchIconSource>(
    currentSource || "feather"
  );
  const [searchQuery, setSearchQuery] = React.useState("");

  // Get the pack for the current tab
  const currentTab = TABS.find((t) => t.value === activeTab);
  const currentPack: IconPack =
    currentTab?.pack === "upload"
      ? ICON_PACKS.ALL
      : (currentTab?.pack as IconPack) || ICON_PACKS.ALL;

  // Use icon search for catalog icons
  const { icons, isLoading } = useIconSearch({
    searchQuery,
    selectedPack: activeTab === "upload" ? ICON_PACKS.ALL : currentPack,
  });

  // Filter uploaded assets by search query
  const filteredUploads = React.useMemo(() => {
    if (!searchQuery) return uploadedAssets;
    const query = searchQuery.toLowerCase();
    return uploadedAssets.filter(
      (a) =>
        a.name.toLowerCase().includes(query) ||
        a.filename.toLowerCase().includes(query)
    );
  }, [uploadedAssets, searchQuery]);

  // Reset search when tab changes
  React.useEffect(() => {
    setSearchQuery("");
  }, [activeTab]);

  // Update active tab when currentSource changes
  React.useEffect(() => {
    if (currentSource) {
      setActiveTab(currentSource);
    }
  }, [currentSource]);

  const handleIconSelect = (icon: IconMetadata) => {
    // Determine source from icon pack
    let source: BatchIconSource = "feather";
    switch (icon.pack) {
      case "zendesk-garden":
        source = "zendesk-garden";
        break;
      case "feather":
        source = "feather";
        break;
      case "remixicon":
        source = "remixicon";
        break;
      case "emoji":
        source = "emoji";
        break;
      default:
        source = "feather";
    }

    onSelect(source, icon.name, icon.id);
    onOpenChange(false);
  };

  const handleUploadSelect = (asset: UploadedAsset) => {
    onSelect("upload", asset.name, asset.iconId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select Icon</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search icons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as BatchIconSource)}
          >
            <TabsList className="grid w-full grid-cols-5">
              {TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Icon pack tabs */}
            {TABS.filter((t) => t.value !== "upload").map((tab) => (
              <TabsContent key={tab.value} value={tab.value}>
                <ScrollArea className="h-[300px]">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-sm text-muted-foreground">
                        Loading icons...
                      </p>
                    </div>
                  ) : icons.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-sm text-muted-foreground">
                        No icons found
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-8 gap-2 p-2">
                      {icons.slice(0, 200).map((icon) => (
                        <IconGridItem
                          key={icon.id}
                          icon={icon}
                          isSelected={false}
                          onSelect={() => handleIconSelect(icon)}
                        />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            ))}

            {/* Uploaded assets tab */}
            <TabsContent value="upload">
              <ScrollArea className="h-[300px]">
                {uploadedAssets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2">
                    <FileImage className="size-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No uploaded assets
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Upload images/SVGs in Step 1
                    </p>
                  </div>
                ) : filteredUploads.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-muted-foreground">
                      No matching uploads
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-8 gap-2 p-2">
                    {filteredUploads.map((asset) => (
                      <UploadedAssetItem
                        key={asset.iconId}
                        asset={asset}
                        isSelected={false}
                        onSelect={() => handleUploadSelect(asset)}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
