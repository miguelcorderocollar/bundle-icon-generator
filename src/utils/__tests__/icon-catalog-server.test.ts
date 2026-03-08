import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearIconCatalogServerCache,
  getIconByIdServer,
  getIconPacksServer,
  getRemixIconCategoriesServer,
  loadIconCatalogServer,
  searchIconsServer,
} from "../icon-catalog-server";
import type { IconCatalog } from "@/src/types/icon";

const { readFileMock } = vi.hoisted(() => ({
  readFileMock: vi.fn(),
}));

vi.mock("node:fs/promises", () => ({
  readFile: readFileMock,
  default: {
    readFile: readFileMock,
  },
}));

const sampleCatalog: IconCatalog = {
  meta: {
    version: "test",
    generatedAt: "2026-01-01T00:00:00.000Z",
    totalIcons: 3,
  },
  licenses: {
    "zendesk-garden": { name: "Garden", type: "Apache-2.0", url: "#" },
    feather: { name: "Feather", type: "MIT", url: "#" },
    remixicon: { name: "RemixIcon", type: "Apache-2.0", url: "#" },
    emoji: { name: "Emoji", type: "CC0", url: "#" },
    "custom-svg": { name: "Custom SVG", type: "Custom", url: "#" },
    "custom-image": { name: "Custom Image", type: "Custom", url: "#" },
  },
  icons: {
    "feather-star": {
      id: "feather-star",
      name: "Star",
      pack: "feather",
      svg: '<svg viewBox="0 0 24 24"><path d="M0 0"/></svg>',
      keywords: ["star", "favorite"],
    },
    "remixicon-home-line": {
      id: "remixicon-home-line",
      name: "Home",
      pack: "remixicon",
      svg: '<svg viewBox="0 0 24 24"><path d="M0 0"/></svg>',
      keywords: ["home"],
      category: "Buildings",
    },
    "remixicon-home-fill": {
      id: "remixicon-home-fill",
      name: "Home Fill",
      pack: "remixicon",
      svg: '<svg viewBox="0 0 24 24"><path d="M0 0"/></svg>',
      keywords: ["home", "fill"],
      category: "Buildings",
    },
  },
  byPack: {
    "zendesk-garden": [],
    feather: ["feather-star"],
    remixicon: ["remixicon-home-line", "remixicon-home-fill"],
    emoji: [],
    "custom-svg": [],
    "custom-image": [],
  },
};

describe("icon-catalog-server", () => {
  beforeEach(() => {
    clearIconCatalogServerCache();
    readFileMock.mockReset();
    readFileMock.mockResolvedValue(JSON.stringify(sampleCatalog));
  });

  it("loads and caches icon catalog", async () => {
    const first = await loadIconCatalogServer();
    const second = await loadIconCatalogServer();

    expect(first.meta.totalIcons).toBe(3);
    expect(second.meta.version).toBe("test");
    expect(readFileMock).toHaveBeenCalledTimes(1);
  });

  it("searches icons with pack, category, and pagination", async () => {
    const results = await searchIconsServer({
      query: "home",
      pack: "remixicon",
      category: "Buildings",
      limit: 1,
      offset: 1,
    });

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("remixicon-home-fill");
  });

  it("gets icon by id and returns null when missing", async () => {
    const icon = await getIconByIdServer("feather-star");
    const missing = await getIconByIdServer("missing-id");

    expect(icon?.name).toBe("Star");
    expect(missing).toBeNull();
  });

  it("returns remix categories and pack counts", async () => {
    const categories = await getRemixIconCategoriesServer();
    const packs = await getIconPacksServer();

    expect(categories).toEqual(["Buildings"]);
    expect(packs.find((pack) => pack.id === "feather")?.count).toBe(1);
    expect(packs.find((pack) => pack.id === "remixicon")?.count).toBe(2);
  });
});
