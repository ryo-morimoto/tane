import { describe, it, expect } from "vitest";
import { formatError } from "./format-error.js";
import { GitHubApiError } from "./github.js";

describe("formatError", () => {
  const appSlug = "tane-app";
  const origin = "https://tane.ryo-o.dev";

  it("returns re-authorize link for GitHubApiError 401", () => {
    const err = new GitHubApiError(401, "Unauthorized");
    expect(formatError(err, appSlug, origin)).toBe(
      "Authentication failed. Re-authorize at https://tane.ryo-o.dev/auth/github",
    );
  });

  it("returns install link for GitHubApiError 403", () => {
    const err = new GitHubApiError(403, "Forbidden");
    expect(formatError(err, appSlug, origin)).toBe(
      "Permission denied. Ensure the tane GitHub App is installed and has access to the ideas repository: https://github.com/apps/tane-app/installations/new",
    );
  });

  it("returns wrapped message for other GitHubApiError", () => {
    const err = new GitHubApiError(500, "GitHub API error: 500");
    expect(formatError(err, appSlug, origin)).toBe("An error occurred: GitHub API error: 500");
  });

  it("passes through plain Error message", () => {
    const err = new Error("Repository not found. Create it at https://github.com/new?name=ideas");
    expect(formatError(err, appSlug, origin)).toBe(
      "Repository not found. Create it at https://github.com/new?name=ideas",
    );
  });

  it("stringifies non-Error values", () => {
    expect(formatError("something broke", appSlug, origin)).toBe(
      "An error occurred: something broke",
    );
  });
});
