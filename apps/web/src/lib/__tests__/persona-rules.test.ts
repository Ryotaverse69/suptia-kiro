import { describe, it, expect } from "vitest";
import { evaluatePersonaWarnings } from "@/lib/persona-rules";

const textWithNG = "このサプリで完治。即効で変化、必ず痩せると話題。";

describe("persona-rules", () => {
  it("general persona flags 3 NG expressions", () => {
    const v = evaluatePersonaWarnings(textWithNG, { personas: ["general"] });
    expect(v.length).toBeGreaterThanOrEqual(3);
    expect(v.map((x) => x.originalText)).toEqual(
      expect.arrayContaining([expect.stringMatching(/完治|即効|必ず痩せる/i)]),
    );
  });

  it("underage persona also flags weight-loss claims", () => {
    const v = evaluatePersonaWarnings(textWithNG, { personas: ["underage"] });
    // should include weight-loss and cure claims at minimum
    expect(v.map((x) => x.originalText).join(" ")).toMatch(/必ず痩せる/);
    expect(v.map((x) => x.originalText).join(" ")).toMatch(/完治/);
  });

  it("medical_professional allows some claims not targeted", () => {
    const v = evaluatePersonaWarnings(textWithNG, {
      personas: ["medical_professional"],
    });
    // weight-loss may be omitted in professional targeting, but "即効" is global
    expect(v.map((x) => x.originalText).join(" ")).toMatch(/即効/);
  });
});
