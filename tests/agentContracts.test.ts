import { describe, expect, it } from "vitest";
import { AGENT_IDS, isAgentId } from "../lib/agents/agentContracts";

describe("agent contracts", () => {
  it("defines the planned agent council ids", () => {
    expect(AGENT_IDS).toContain("career-strategy");
    expect(AGENT_IDS).toContain("israeli-job-market");
    expect(AGENT_IDS).toContain("final-decision-chief");
  });

  it("validates agent ids without running agents", () => {
    expect(isAgentId("risk-compliance")).toBe(true);
    expect(isAgentId("send-email-agent")).toBe(false);
  });
});
