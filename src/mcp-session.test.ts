import { describe, it, expect } from "vitest";
import { TaneMcpSession } from "./mcp-session.js";

describe("TaneMcpSession", () => {
  it("is a class with a fetch method", () => {
    expect(typeof TaneMcpSession).toBe("function");
    expect(typeof TaneMcpSession.prototype.fetch).toBe("function");
  });
});
