import { GitHubApiError } from "./github.js";

export function formatError(error: unknown, appSlug: string, origin: string): string {
  if (error instanceof GitHubApiError) {
    if (error.status === 401) {
      return `Authentication failed. Re-authorize at ${origin}/auth/github`;
    }
    if (error.status === 403) {
      return `Permission denied. Ensure the tane GitHub App is installed and has access to the ideas repository: https://github.com/apps/${appSlug}/installations/new`;
    }
    return `An error occurred: ${error.message}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return `An error occurred: ${String(error)}`;
}
