/**
 * Test for Next.js configuration headers
 * This tests the headers configuration in next.config.js
 */

describe("Next.js Configuration Headers", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it("should define security headers configuration", () => {
    // Import the next config
    const nextConfig = require("../../../next.config.js");

    expect(nextConfig.headers).toBeDefined();
    expect(typeof nextConfig.headers).toBe("function");
  });

  it("should return proper security headers for all routes", async () => {
    const nextConfig = require("../../../next.config.js");
    const headers = await nextConfig.headers();

    expect(headers).toHaveLength(1);
    expect(headers[0].source).toBe("/(.*)");

    const securityHeaders = headers[0].headers;
    const headerMap = securityHeaders.reduce(
      (acc: Record<string, string>, header: any) => {
        acc[header.key] = header.value;
        return acc;
      },
      {},
    );

    expect(headerMap["X-Content-Type-Options"]).toBe("nosniff");
    expect(headerMap["X-Frame-Options"]).toBe("DENY");
    expect(headerMap["Referrer-Policy"]).toBe(
      "strict-origin-when-cross-origin",
    );
    expect(headerMap["Permissions-Policy"]).toContain("camera=()");
    expect(headerMap["Permissions-Policy"]).toContain("microphone=()");
    expect(headerMap["Permissions-Policy"]).toContain("geolocation=()");
    expect(headerMap["Permissions-Policy"]).toContain("payment=()");
    expect(headerMap["Permissions-Policy"]).toContain("usb=()");
    expect(headerMap["Permissions-Policy"]).toContain("bluetooth=()");
  });

  it("should include development CSP when NODE_ENV is development", async () => {
    process.env.NODE_ENV = "development";

    const nextConfig = require("../../../next.config.js");
    const headers = await nextConfig.headers();

    const securityHeaders = headers[0].headers;
    const cspHeader = securityHeaders.find(
      (h: any) => h.key === "Content-Security-Policy",
    );

    expect(cspHeader).toBeDefined();
    expect(cspHeader.value).toContain(
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    );
    expect(cspHeader.value).toContain(
      "connect-src 'self' https://*.sanity.io ws: wss:",
    );
    expect(cspHeader.value).toContain("object-src 'none'");
    expect(cspHeader.value).toContain("base-uri 'self'");
    expect(cspHeader.value).toContain("form-action 'self'");
    expect(cspHeader.value).toContain("frame-ancestors 'none'");
  });

  it("should not include CSP in production (handled by middleware)", async () => {
    process.env.NODE_ENV = "production";

    const nextConfig = require("../../../next.config.js");
    const headers = await nextConfig.headers();

    const securityHeaders = headers[0].headers;
    const cspHeader = securityHeaders.find(
      (h: any) => h.key === "Content-Security-Policy",
    );

    expect(cspHeader).toBeUndefined();
  });

  it("should have comprehensive Permissions-Policy restrictions", async () => {
    const nextConfig = require("../../../next.config.js");
    const headers = await nextConfig.headers();

    const securityHeaders = headers[0].headers;
    const permissionsHeader = securityHeaders.find(
      (h: any) => h.key === "Permissions-Policy",
    );

    expect(permissionsHeader.value).toContain("camera=()");
    expect(permissionsHeader.value).toContain("microphone=()");
    expect(permissionsHeader.value).toContain("geolocation=()");
    expect(permissionsHeader.value).toContain("payment=()");
    expect(permissionsHeader.value).toContain("usb=()");
    expect(permissionsHeader.value).toContain("bluetooth=()");
    expect(permissionsHeader.value).toContain("magnetometer=()");
    expect(permissionsHeader.value).toContain("gyroscope=()");
    expect(permissionsHeader.value).toContain("accelerometer=()");
  });
});
