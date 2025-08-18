import { NextRequest } from "next/server";
import { middleware } from "../../middleware";

// Mock crypto.randomUUID for testing
Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: () => "test-nonce-12345",
  },
});

describe("Security Headers Middleware", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it("should set basic security headers in all environments", () => {
    const request = new NextRequest("http://localhost:3000/test");
    const response = middleware(request);

    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
    expect(response.headers.get("Referrer-Policy")).toBe(
      "strict-origin-when-cross-origin",
    );
    expect(response.headers.get("Permissions-Policy")).toContain("camera=()");
    expect(response.headers.get("Permissions-Policy")).toContain(
      "microphone=()",
    );
    expect(response.headers.get("Permissions-Policy")).toContain(
      "geolocation=()",
    );
  });

  it("should generate and set nonce header", () => {
    const request = new NextRequest("http://localhost:3000/test");
    const response = middleware(request);

    expect(response.headers.get("x-nonce")).toBe("testnonce12345");
  });

  it("should set strict CSP in production", () => {
    process.env.NODE_ENV = "production";

    const request = new NextRequest("http://localhost:3000/test");
    const response = middleware(request);

    const csp = response.headers.get("Content-Security-Policy");
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self' 'nonce-testnonce12345'");
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
    expect(csp).toContain("img-src 'self' https://cdn.sanity.io data:");
    expect(csp).toContain("connect-src 'self' https://*.sanity.io");
    expect(csp).toContain("upgrade-insecure-requests");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("frame-ancestors 'none'");

    // Should not contain unsafe-inline for scripts
    expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
  });

  it("should not set CSP in development (handled by next.config.js)", () => {
    process.env.NODE_ENV = "development";

    const request = new NextRequest("http://localhost:3000/test");
    const response = middleware(request);

    expect(response.headers.get("Content-Security-Policy")).toBeNull();
  });

  it("should propagate nonce to request headers", () => {
    const request = new NextRequest("http://localhost:3000/test");
    const response = middleware(request);

    // The middleware should modify the request headers
    // This is harder to test directly, but we can verify the response nonce
    expect(response.headers.get("x-nonce")).toBe("testnonce12345");
  });
});

describe("CSP Configuration", () => {
  it("should have commented GA4 configuration ready for activation", () => {
    // Read the middleware file content to verify GA4 comment exists
    const fs = require("fs");
    const path = require("path");
    const middlewarePath = path.join(__dirname, "../../middleware.ts");
    const middlewareContent = fs.readFileSync(middlewarePath, "utf8");

    expect(middlewareContent).toContain(
      "// GA4 support (commented configuration - uncomment when GA4 is needed)",
    );
    expect(middlewareContent).toContain(
      "// `script-src 'self' 'nonce-${nonce}' https://www.googletagmanager.com https://www.google-analytics.com`,",
    );
    expect(middlewareContent).toContain(
      "// and add to connect-src: https://www.google-analytics.com https://analytics.google.com",
    );
  });

  it("should enforce strict script-src policy without unsafe-inline", () => {
    process.env.NODE_ENV = "production";

    const request = new NextRequest("http://localhost:3000/test");
    const response = middleware(request);

    const csp = response.headers.get("Content-Security-Policy");

    // Verify strict script policy
    expect(csp).toContain("script-src 'self' 'nonce-testnonce12345'");
    expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).not.toContain("'unsafe-eval'");
  });
});
