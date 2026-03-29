import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET as getIconsRoute } from "../icons/route";
import { GET as getIconByIdRoute } from "../icons/[id]/route";
import { POST as postGenerateRoute } from "../generate/route";
import {
  getIconByIdServer,
  searchIconsServer,
} from "@/src/utils/icon-catalog-server";
import { renderSvgServer } from "@/src/utils/renderer-server";

vi.mock("@/src/utils/icon-catalog-server", () => ({
  searchIconsServer: vi.fn(),
  getIconByIdServer: vi.fn(),
}));

vi.mock("@/src/utils/renderer-server", () => ({
  renderSvgServer: vi.fn(),
}));

describe("API routes", () => {
  beforeEach(() => {
    vi.mocked(searchIconsServer).mockReset();
    vi.mocked(getIconByIdServer).mockReset();
    vi.mocked(renderSvgServer).mockReset();
  });

  it("returns filtered icon metadata for /api/icons", async () => {
    vi.mocked(searchIconsServer).mockResolvedValue([
      {
        id: "feather-star",
        name: "Star",
        pack: "feather",
        svg: "<svg />",
        keywords: ["star"],
      },
    ]);

    const request = new NextRequest(
      "http://localhost:3000/api/icons?q=star&limit=10"
    );
    const response = await getIconsRoute(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.count).toBe(1);
    expect(body.icons[0].id).toBe("feather-star");
    expect(body.icons[0].svg).toBeUndefined();
  });

  it("returns 404 for unknown icon in /api/icons/[id]", async () => {
    vi.mocked(getIconByIdServer).mockResolvedValue(null);
    const request = new NextRequest("http://localhost:3000/api/icons/missing");

    const response = await getIconByIdRoute(request, {
      params: Promise.resolve({ id: "missing" }),
    });

    expect(response.status).toBe(404);
  });

  it("returns JSON payload for /api/generate by default", async () => {
    vi.mocked(getIconByIdServer).mockResolvedValue({
      id: "feather-star",
      name: "Star",
      pack: "feather",
      svg: '<svg viewBox="0 0 24 24"><path d="M0 0"/></svg>',
      keywords: ["star"],
    });
    vi.mocked(renderSvgServer).mockReturnValue("<svg>rendered</svg>");

    const request = new NextRequest("http://localhost:3000/api/generate", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        iconId: "feather-star",
        backgroundColor: "#063940",
        iconColor: "#ffffff",
        size: 128,
      }),
    });

    const response = await postGenerateRoute(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.svg).toBe("<svg>rendered</svg>");
    expect(body.icon.id).toBe("feather-star");
    expect(body.settings.padding).toBe(8);
    expect(body.settings.cornerRadius).toBe(0);
    expect(body.settings.borderEnabled).toBe(false);
    expect(body.settings.borderColor).toBe("#ffffff");
    expect(body.settings.borderWidth).toBe(6);
    expect(renderSvgServer).toHaveBeenCalledWith(
      expect.objectContaining({
        padding: 8,
        cornerRadius: 0,
        borderEnabled: false,
        borderColor: "#ffffff",
        borderWidth: 6,
      })
    );
  });

  it("returns raw SVG when Accept header requests image/svg+xml", async () => {
    vi.mocked(getIconByIdServer).mockResolvedValue({
      id: "feather-star",
      name: "Star",
      pack: "feather",
      svg: '<svg viewBox="0 0 24 24"><path d="M0 0"/></svg>',
      keywords: ["star"],
    });
    vi.mocked(renderSvgServer).mockReturnValue("<svg>raw</svg>");

    const request = new NextRequest("http://localhost:3000/api/generate", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "image/svg+xml",
      },
      body: JSON.stringify({
        iconId: "feather-star",
        backgroundColor: "#063940",
        iconColor: "#ffffff",
        size: 128,
      }),
    });

    const response = await postGenerateRoute(request);
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("image/svg+xml");
    expect(text).toBe("<svg>raw</svg>");
  });

  it("returns validation error when /api/generate payload is invalid", async () => {
    const request = new NextRequest("http://localhost:3000/api/generate", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        iconId: "",
        backgroundColor: "not-a-color",
      }),
    });

    const response = await postGenerateRoute(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("validation_failed");
  });
});
