/**
 * PNG preview component showing logo.png and logo-small.png
 */

import { ScrollArea } from "@/components/ui/scroll-area";
import { PreviewPlaceholder } from "./PreviewPlaceholder";
import { PNG_SPECS } from "@/src/constants/app";

export function PngPreview() {
  return (
    <ScrollArea className="h-full">
      <div className="space-y-6 pr-4">
        <PreviewPlaceholder
          filename={PNG_SPECS.LOGO.filename}
          dimensions={`${PNG_SPECS.LOGO.width}×${PNG_SPECS.LOGO.height}`}
          size="large"
        />
        <PreviewPlaceholder
          filename={PNG_SPECS.LOGO_SMALL.filename}
          dimensions={`${PNG_SPECS.LOGO_SMALL.width}×${PNG_SPECS.LOGO_SMALL.height}`}
          size="medium"
        />
      </div>
    </ScrollArea>
  );
}

