import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const SCRIPT_PATH = resolve(
  process.cwd(),
  ".agents/skills/icon-bundle-generator/scripts/generate-bundle-assets.py"
);

function runScript(args: string[]) {
  return spawnSync("python3", [SCRIPT_PATH, ...args], {
    encoding: "utf-8",
  });
}

describe("generate-bundle-assets.py", () => {
  it("shows supported preset IDs in help output", () => {
    const result = runScript(["--help"]);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("favicon-bundle");
    expect(result.stdout).toContain("macos-app-icon");
    expect(result.stdout).toContain("single-svg");
  });

  it("requires either --preset or --all-presets", () => {
    const result = runScript(["--input-svg", "dummy.svg"]);

    expect(result.status).not.toBe(0);
    expect(result.stderr || result.stdout).toContain(
      "Provide --preset or --all-presets."
    );
  });

  it("validates --ico-sizes format", () => {
    const result = runScript([
      "--input-svg",
      "dummy.svg",
      "--preset",
      "single-svg",
      "--ico-sizes",
      "abc",
    ]);

    expect(result.status).not.toBe(0);
    expect(result.stderr || result.stdout).toContain("Invalid ICO size");
  });

  it("generates single-svg bundle without raster dependencies", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "bundle-assets-test-"));

    try {
      const inputSvg = join(tempDir, "icon.svg");
      const outputDir = join(tempDir, "out");
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"></svg>';

      writeFileSync(inputSvg, svg, "utf-8");

      const result = runScript([
        "--input-svg",
        inputSvg,
        "--output-dir",
        outputDir,
        "--preset",
        "single-svg",
      ]);

      expect(result.status).toBe(0);

      const generatedSvg = join(outputDir, "single-svg", "icon.svg");
      expect(existsSync(generatedSvg)).toBe(true);
      expect(readFileSync(generatedSvg, "utf-8")).toBe(svg);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
