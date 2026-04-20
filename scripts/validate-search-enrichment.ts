#!/usr/bin/env tsx

import fs from "fs";
import path from "path";

type EnrichmentEntry = {
  id: string;
  description: string;
  synonyms: string[];
};

type ValidationIssue = {
  file: string;
  id?: string;
  message: string;
};

type ProgressReport = {
  totalIcons: number;
  completedIcons: number;
  remainingIcons: number;
  percentComplete: number;
  batches: number;
  files: number;
  issues: ValidationIssue[];
};

const PROJECT_ROOT = path.resolve(__dirname, "..");
const CATALOG_PATH = path.join(PROJECT_ROOT, "public", "icon-catalog.json");
const ENRICHMENT_DIR = path.join(PROJECT_ROOT, "search-enrichment");

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function isLowercaseTerm(term: string): boolean {
  return term === term.toLowerCase();
}

function validateEntry(
  entry: EnrichmentEntry,
  knownIds: Set<string>,
  fileName: string
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (typeof entry.id !== "string" || !entry.id.trim()) {
    issues.push({
      file: fileName,
      message: "entry.id must be a non-empty string",
    });
  } else if (!knownIds.has(entry.id)) {
    issues.push({
      file: fileName,
      id: entry.id,
      message: "entry.id does not exist in the icon catalog",
    });
  }

  if (typeof entry.description !== "string" || !entry.description.trim()) {
    issues.push({
      file: fileName,
      id: entry.id,
      message: "entry.description must be a non-empty string",
    });
  } else {
    const count = wordCount(entry.description);
    if (count < 4 || count > 12) {
      issues.push({
        file: fileName,
        id: entry.id,
        message: `entry.description must be 4-12 words (got ${count})`,
      });
    }
  }

  if (!Array.isArray(entry.synonyms)) {
    issues.push({
      file: fileName,
      id: entry.id,
      message: "entry.synonyms must be an array",
    });
    return issues;
  }

  if (entry.synonyms.length < 3 || entry.synonyms.length > 8) {
    issues.push({
      file: fileName,
      id: entry.id,
      message: `entry.synonyms must contain 3-8 items (got ${entry.synonyms.length})`,
    });
  }

  const normalized = new Set<string>();
  for (const synonym of entry.synonyms) {
    if (typeof synonym !== "string" || !synonym.trim()) {
      issues.push({
        file: fileName,
        id: entry.id,
        message: "synonyms must be non-empty strings",
      });
      continue;
    }

    const trimmed = synonym.trim();
    if (!isLowercaseTerm(trimmed)) {
      issues.push({
        file: fileName,
        id: entry.id,
        message: `synonym must be lowercase: ${trimmed}`,
      });
    }

    if (normalized.has(trimmed)) {
      issues.push({
        file: fileName,
        id: entry.id,
        message: `duplicate synonym: ${trimmed}`,
      });
    }
    normalized.add(trimmed);
  }

  return issues;
}

function main() {
  const catalog = readJsonFile<{
    meta: { totalIcons: number };
    icons: Record<string, unknown>;
  }>(CATALOG_PATH);

  const knownIds = new Set(Object.keys(catalog.icons));
  const batchFiles = fs
    .readdirSync(ENRICHMENT_DIR)
    .filter((file) => /^batch-\d+\.json$/.test(file))
    .sort();

  const issues: ValidationIssue[] = [];
  const seenIds = new Set<string>();

  for (const file of batchFiles) {
    const filePath = path.join(ENRICHMENT_DIR, file);
    let entries: unknown;

    try {
      entries = readJsonFile<unknown>(filePath);
    } catch (error) {
      issues.push({
        file,
        message: `invalid JSON: ${(error as Error).message}`,
      });
      continue;
    }

    if (!Array.isArray(entries)) {
      issues.push({ file, message: "batch file must contain a JSON array" });
      continue;
    }

    for (const entry of entries) {
      if (!entry || typeof entry !== "object") {
        issues.push({ file, message: "each entry must be an object" });
        continue;
      }

      const typedEntry = entry as EnrichmentEntry;
      issues.push(...validateEntry(typedEntry, knownIds, file));

      if (typeof typedEntry.id === "string" && typedEntry.id.trim()) {
        if (seenIds.has(typedEntry.id)) {
          issues.push({
            file,
            id: typedEntry.id,
            message: "duplicate icon id across batch files",
          });
        }
        seenIds.add(typedEntry.id);
      }
    }
  }

  const completedIcons = seenIds.size;
  const totalIcons = catalog.meta.totalIcons;
  const remainingIcons = Math.max(totalIcons - completedIcons, 0);
  const percentComplete =
    totalIcons > 0 ? (completedIcons / totalIcons) * 100 : 0;

  const report: ProgressReport = {
    totalIcons,
    completedIcons,
    remainingIcons,
    percentComplete,
    batches: batchFiles.length,
    files: batchFiles.length,
    issues,
  };

  const output = {
    ...report,
    percentComplete: Number(report.percentComplete.toFixed(2)),
  };

  console.log(JSON.stringify(output, null, 2));

  if (issues.length > 0) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}
