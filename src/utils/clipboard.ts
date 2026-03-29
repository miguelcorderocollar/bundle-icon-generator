export function isImageClipboardSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "clipboard" in navigator &&
    typeof navigator.clipboard.write === "function" &&
    typeof ClipboardItem !== "undefined"
  );
}

export async function writeImageToClipboard(blob: Blob): Promise<void> {
  if (!isImageClipboardSupported()) {
    throw new Error("Image clipboard is not supported in this browser");
  }

  const item = new ClipboardItem({
    [blob.type || "image/png"]: blob,
  });

  await navigator.clipboard.write([item]);
}
