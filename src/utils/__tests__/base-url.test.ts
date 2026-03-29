import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveBaseUrl } from "../base-url";

describe("resolveBaseUrl", () => {
  const originalEnv = {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    API_BASE_URL: process.env.API_BASE_URL,
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    VERCEL_BRANCH_URL: process.env.VERCEL_BRANCH_URL,
    VERCEL_URL: process.env.VERCEL_URL,
  };

  afterEach(() => {
    process.env.NEXT_PUBLIC_BASE_URL = originalEnv.NEXT_PUBLIC_BASE_URL;
    process.env.API_BASE_URL = originalEnv.API_BASE_URL;
    process.env.VERCEL_PROJECT_PRODUCTION_URL =
      originalEnv.VERCEL_PROJECT_PRODUCTION_URL;
    process.env.VERCEL_BRANCH_URL = originalEnv.VERCEL_BRANCH_URL;
    process.env.VERCEL_URL = originalEnv.VERCEL_URL;
    vi.unstubAllGlobals();
  });

  it("uses the browser origin on the client", () => {
    expect(resolveBaseUrl()).toBe("http://localhost:3000");
  });

  it("prefers NEXT_PUBLIC_BASE_URL on the server", () => {
    vi.stubGlobal("window", undefined);
    process.env.NEXT_PUBLIC_BASE_URL = "https://bundle-icon-generator.app/";
    delete process.env.API_BASE_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    delete process.env.VERCEL_BRANCH_URL;
    delete process.env.VERCEL_URL;

    expect(resolveBaseUrl()).toBe("https://bundle-icon-generator.app");
  });

  it("falls back to Vercel production URL when the public base URL is missing", () => {
    vi.stubGlobal("window", undefined);
    delete process.env.NEXT_PUBLIC_BASE_URL;
    delete process.env.API_BASE_URL;
    process.env.VERCEL_PROJECT_PRODUCTION_URL =
      "bundle-icon-generator.vercel.app";
    delete process.env.VERCEL_BRANCH_URL;
    delete process.env.VERCEL_URL;

    expect(resolveBaseUrl()).toBe("https://bundle-icon-generator.vercel.app");
  });

  it("infers https from forwarded hosts on the server", () => {
    vi.stubGlobal("window", undefined);
    delete process.env.NEXT_PUBLIC_BASE_URL;
    delete process.env.API_BASE_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    delete process.env.VERCEL_BRANCH_URL;
    delete process.env.VERCEL_URL;

    expect(
      resolveBaseUrl({
        host: "bundle-icon-generator.vercel.app",
      })
    ).toBe("https://bundle-icon-generator.vercel.app");
  });

  it("keeps localhost hosts on http", () => {
    vi.stubGlobal("window", undefined);
    delete process.env.NEXT_PUBLIC_BASE_URL;
    delete process.env.API_BASE_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    delete process.env.VERCEL_BRANCH_URL;
    delete process.env.VERCEL_URL;

    expect(
      resolveBaseUrl({
        host: "localhost:4321",
      })
    ).toBe("http://localhost:4321");
  });
});
