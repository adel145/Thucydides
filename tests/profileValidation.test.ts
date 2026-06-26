import { describe, expect, it } from "vitest";
import { validateProfileInput } from "../lib/profile/validateProfile";

describe("validateProfileInput", () => {
  it("requires name and location", () => {
    const result = validateProfileInput({
      fullName: "",
      location: "",
      targetSalaryGrossNis: null,
      minimumSalaryGrossNis: null
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("Full name is required.");
    expect(result.errors).toContain("Location is required.");
  });

  it("rejects target salary below minimum salary", () => {
    const result = validateProfileInput({
      fullName: "Adel Mohsen",
      location: "Beersheba",
      targetSalaryGrossNis: 7000,
      minimumSalaryGrossNis: 8000
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("Target salary should not be lower than the temporary minimum salary.");
  });
});
