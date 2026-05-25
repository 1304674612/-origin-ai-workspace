import { describe, it, expect } from "vitest";
import { appConfig } from "../index";

describe("appConfig", () => {
  it("has expected shape", () => {
    expect(appConfig).toHaveProperty("name");
    expect(appConfig).toHaveProperty("tagline");
    expect(appConfig).toHaveProperty("repositoryUrl");
  });

  it("name is a non-empty string", () => {
    expect(typeof appConfig.name).toBe("string");
    expect(appConfig.name.length).toBeGreaterThan(0);
  });

  it("repositoryUrl is a GitHub URL", () => {
    expect(appConfig.repositoryUrl).toContain("github.com");
  });
});
