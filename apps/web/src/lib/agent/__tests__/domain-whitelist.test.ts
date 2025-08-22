import { describe, it, expect, beforeEach } from "vitest";
import {
  DomainWhitelist,
  domainWhitelist,
  isDomainAllowed,
  validateNetworkAccess,
  checkUrlSafety,
} from "../domain-whitelist";

describe("DomainWhitelist", () => {
  let whitelist: DomainWhitelist;

  beforeEach(() => {
    whitelist = new DomainWhitelist();
  });

  describe("isDomainAllowed", () => {
    it("should allow Sanity domains", () => {
      expect(whitelist.isDomainAllowed("sanity.io")).toBe(true);
      expect(whitelist.isDomainAllowed("api.sanity.io")).toBe(true);
      expect(whitelist.isDomainAllowed("cdn.sanity.io")).toBe(true);
      expect(whitelist.isDomainAllowed("studio.sanity.io")).toBe(true);
    });

    it("should allow company domains", () => {
      expect(whitelist.isDomainAllowed("suptia.com")).toBe(true);
      expect(whitelist.isDomainAllowed("www.suptia.com")).toBe(true);
      expect(whitelist.isDomainAllowed("api.suptia.com")).toBe(true);
    });

    it("should allow localhost and local IPs", () => {
      expect(whitelist.isDomainAllowed("localhost")).toBe(true);
      expect(whitelist.isDomainAllowed("127.0.0.1")).toBe(true);
      expect(whitelist.isDomainAllowed("0.0.0.0")).toBe(true);
    });

    it("should allow localhost with ports", () => {
      expect(whitelist.isDomainAllowed("localhost:3000")).toBe(true);
      expect(whitelist.isDomainAllowed("127.0.0.1:3001")).toBe(true);
    });

    it("should block external domains", () => {
      expect(whitelist.isDomainAllowed("google.com")).toBe(false);
      expect(whitelist.isDomainAllowed("github.com")).toBe(false);
      expect(whitelist.isDomainAllowed("malicious-site.com")).toBe(false);
    });

    it("should block explicitly blocked domains", () => {
      expect(whitelist.isDomainAllowed("bit.ly")).toBe(false);
      expect(whitelist.isDomainAllowed("tinyurl.com")).toBe(false);
      expect(whitelist.isDomainAllowed("repl.it")).toBe(false);
    });
  });

  describe("validateDomain", () => {
    it("should provide detailed validation for allowed domains", () => {
      const result = whitelist.validateDomain("api.sanity.io");

      expect(result.allowed).toBe(true);
      expect(result.domain).toBe("api.sanity.io");
      expect(result.reason).toContain("allowed list");
      expect(result.matchedPattern).toBe("*.sanity.io");
    });

    it("should provide detailed validation for blocked domains", () => {
      const result = whitelist.validateDomain("bit.ly");

      expect(result.allowed).toBe(false);
      expect(result.domain).toBe("bit.ly");
      expect(result.reason).toContain("explicitly blocked");
      expect(result.matchedPattern).toBe("bit.ly");
    });

    it("should provide detailed validation for unknown domains", () => {
      const result = whitelist.validateDomain("unknown-site.com");

      expect(result.allowed).toBe(false);
      expect(result.domain).toBe("unknown-site.com");
      expect(result.reason).toContain("not in allowed list");
    });

    it("should handle case insensitive domains", () => {
      const result = whitelist.validateDomain("API.SANITY.IO");

      expect(result.allowed).toBe(true);
      expect(result.domain).toBe("api.sanity.io");
    });
  });

  describe("validateNetworkAccess", () => {
    it("should validate HTTPS URLs for allowed domains", () => {
      const result = whitelist.validateNetworkAccess(
        "https://api.sanity.io/v1/data",
      );

      expect(result.allowed).toBe(true);
      expect(result.protocol).toBe("https:");
      expect(result.domain).toBe("api.sanity.io");
    });

    it("should reject HTTP URLs for external domains", () => {
      const result = whitelist.validateNetworkAccess(
        "http://api.sanity.io/v1/data",
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("HTTPS is required");
    });

    it("should allow HTTP for localhost", () => {
      const result = whitelist.validateNetworkAccess(
        "http://localhost:3000/api",
      );

      expect(result.allowed).toBe(true);
      expect(result.protocol).toBe("http:");
      expect(result.domain).toBe("localhost");
      expect(result.port).toBe("3000");
    });

    it("should reject URLs with blocked domains", () => {
      const result = whitelist.validateNetworkAccess(
        "https://bit.ly/malicious",
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("explicitly blocked");
    });

    it("should handle invalid URLs", () => {
      const result = whitelist.validateNetworkAccess("not-a-url");

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Invalid URL format");
    });
  });

  describe("domain management", () => {
    it("should allow adding new domains", () => {
      whitelist.addAllowedDomain("new-domain.com");
      expect(whitelist.isDomainAllowed("new-domain.com")).toBe(true);
    });

    it("should allow removing domains", () => {
      whitelist.addAllowedDomain("temp-domain.com");
      expect(whitelist.isDomainAllowed("temp-domain.com")).toBe(true);

      whitelist.removeAllowedDomain("temp-domain.com");
      expect(whitelist.isDomainAllowed("temp-domain.com")).toBe(false);
    });

    it("should not add duplicate domains", () => {
      const initialCount = whitelist.getAllowedDomains().length;
      whitelist.addAllowedDomain("sanity.io");
      expect(whitelist.getAllowedDomains().length).toBe(initialCount);
    });
  });

  describe("generateAccessReport", () => {
    it("should categorize URLs correctly", () => {
      const urls = [
        "https://api.sanity.io/v1/data",
        "https://suptia.com/api",
        "http://localhost:3000",
        "https://malicious.com/payload",
        "https://bit.ly/short",
      ];

      const report = whitelist.generateAccessReport(urls);

      expect(report.allowed).toContain("https://api.sanity.io/v1/data");
      expect(report.allowed).toContain("https://suptia.com/api");
      expect(report.allowed).toContain("http://localhost:3000");

      expect(report.blocked).toContain("https://malicious.com/payload");
      expect(report.blocked).toContain("https://bit.ly/short");

      expect(report.warnings.length).toBeGreaterThan(0);
    });

    it("should generate warnings for HTTP external domains", () => {
      const urls = ["http://external-site.com/api"];
      const report = whitelist.generateAccessReport(urls);

      expect(
        report.warnings.some((w) =>
          w.includes("HTTP used for external domain"),
        ),
      ).toBe(true);
    });

    it("should generate warnings for wildcard matches", () => {
      const urls = ["https://new.sanity.io/api"];
      const report = whitelist.generateAccessReport(urls);

      expect(
        report.warnings.some((w) => w.includes("Wildcard pattern matched")),
      ).toBe(true);
    });
  });
});

describe("Utility functions", () => {
  it("should export working utility functions", () => {
    expect(isDomainAllowed("sanity.io")).toBe(true);
    expect(isDomainAllowed("malicious.com")).toBe(false);

    const validation = validateNetworkAccess("https://api.sanity.io");
    expect(validation.allowed).toBe(true);

    expect(checkUrlSafety("https://suptia.com")).toBe(true);
    expect(checkUrlSafety("https://malicious.com")).toBe(false);
  });
});

describe("Singleton instance", () => {
  it("should provide working singleton instance", () => {
    expect(domainWhitelist).toBeDefined();
    expect(domainWhitelist.isDomainAllowed("sanity.io")).toBe(true);
    expect(domainWhitelist.isDomainAllowed("malicious.com")).toBe(false);
  });
});

describe("Wildcard pattern matching", () => {
  let whitelist: DomainWhitelist;

  beforeEach(() => {
    whitelist = new DomainWhitelist();
  });

  it("should match wildcard patterns correctly", () => {
    expect(whitelist.isDomainAllowed("any.sanity.io")).toBe(true);
    expect(whitelist.isDomainAllowed("deep.nested.sanity.io")).toBe(true);
    expect(whitelist.isDomainAllowed("api.suptia.com")).toBe(true);
    expect(whitelist.isDomainAllowed("admin.suptia.com")).toBe(true);
  });

  it("should not match partial domain names", () => {
    expect(whitelist.isDomainAllowed("sanity.io.malicious.com")).toBe(false);
    expect(whitelist.isDomainAllowed("fakesanity.io")).toBe(false);
  });
});
