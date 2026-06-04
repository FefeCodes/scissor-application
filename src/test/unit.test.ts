import { describe, it, expect } from "vitest";

const SLUG_REGEX = /^[a-z0-9-]{3,50}$/;
const PHISHING_BLOCKLIST = ["phishing-site.com", "malicious-url.org"];

describe("Scissor Core Verification Pipelines", () => {
  it("should validate slug formatting limitations strictly", () => {
    expect(SLUG_REGEX.test("safe-slug-123")).toBe(true);
    expect(SLUG_REGEX.test("sh")).toBe(false); // Too short
    expect(SLUG_REGEX.test("UPPERCASE-NOT-ALLOWED")).toBe(false);
    expect(SLUG_REGEX.test("invalid_special$")).toBe(false);
  });

  it("should catch blocklisted phishing vectors accurately", () => {
    const checkPhishing = (urlStr: string) => {
      const hostname = new URL(urlStr).hostname.replace("www.", "");
      return PHISHING_BLOCKLIST.includes(hostname);
    };
    expect(checkPhishing("https://phishing-site.com/login")).toBe(true);
    expect(checkPhishing("https://google.com/search")).toBe(false);
  });

  it("should evaluate lifecycle link expirations securely", () => {
    const isLinkExpired = (expiresAt: number) => Date.now() > expiresAt;
    const historicalTime = Date.now() - 5000;
    const futureTime = Date.now() + 5000;

    expect(isLinkExpired(historicalTime)).toBe(true);
    expect(isLinkExpired(futureTime)).toBe(false);
  });
});
