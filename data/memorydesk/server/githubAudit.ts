/**
 * githubAudit.ts
 * Phase 23 — GitHub Repo Live Audit.
 * Fetches live stats for a GitHub repository using the GitHub REST API.
 * Requires GITHUB_TOKEN env var for authenticated requests (higher rate limit).
 */

import { ENV } from "./_core/env";

export interface RepoAuditStats {
  fullName: string;
  description: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  openPRs: number;
  defaultBranch: string;
  lastCommitDate: string | null;
  lastCommitSha: string | null;
  commitCount: number | null;
  contributors: number | null;
  language: string | null;
  topics: string[];
  isPrivate: boolean;
  isArchived: boolean;
  auditedAt: string;
}

const BASE = "https://api.github.com";

function ghHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (ENV.githubToken) {
    headers["Authorization"] = `Bearer ${ENV.githubToken}`;
  }
  return headers;
}

async function ghFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: ghHeaders(),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.warn(`[githubAudit] ${path} → ${res.status} ${res.statusText}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.warn(`[githubAudit] fetch error for ${path}:`, err);
    return null;
  }
}

/**
 * Parse a GitHub repo URL or "owner/repo" slug into "owner/repo".
 * Accepts:
 *   - https://github.com/owner/repo
 *   - https://github.com/owner/repo.git
 *   - owner/repo
 */
export function parseRepoSlug(input: string): string | null {
  const trimmed = input.trim().replace(/\.git$/, "");
  const ghMatch = trimmed.match(/github\.com\/([^/]+\/[^/]+)/);
  if (ghMatch) return ghMatch[1];
  if (/^[^/]+\/[^/]+$/.test(trimmed)) return trimmed;
  return null;
}

export async function auditRepo(repoSlug: string): Promise<RepoAuditStats | null> {
  const slug = parseRepoSlug(repoSlug);
  if (!slug) return null;

  // Parallel fetch: repo info + open PRs + contributors
  const [repoData, prsData, contributorsData] = await Promise.all([
    ghFetch<{
      full_name: string;
      description: string | null;
      stargazers_count: number;
      forks_count: number;
      open_issues_count: number;
      default_branch: string;
      language: string | null;
      topics: string[];
      private: boolean;
      archived: boolean;
    }>(`/repos/${slug}`),
    ghFetch<Array<{ number: number }>>(`/repos/${slug}/pulls?state=open&per_page=1`),
    ghFetch<Array<{ login: string }>>(`/repos/${slug}/contributors?per_page=1&anon=false`),
  ]);

  if (!repoData) return null;

  // Get last commit on default branch
  const commitsData = await ghFetch<Array<{
    sha: string;
    commit: { committer: { date: string } };
  }>>(`/repos/${slug}/commits?per_page=1&sha=${repoData.default_branch}`);

  const lastCommit = commitsData?.[0] ?? null;

  // Get open PR count from Link header (pagination) — simplified: count from array length
  // For accurate count we'd need to paginate, but per_page=1 + total from Link is complex.
  // Use open_issues_count minus open PRs as approximation, or fetch /pulls?state=open&per_page=100
  const prsPage = await ghFetch<Array<{ number: number }>>(`/repos/${slug}/pulls?state=open&per_page=100`);
  const openPRs = prsPage?.length ?? 0;

  // Contributors count
  const contribPage = await ghFetch<Array<{ login: string }>>(`/repos/${slug}/contributors?per_page=100&anon=false`);
  const contributors = contribPage?.length ?? null;

  return {
    fullName: repoData.full_name,
    description: repoData.description,
    stars: repoData.stargazers_count,
    forks: repoData.forks_count,
    openIssues: Math.max(0, repoData.open_issues_count - openPRs),
    openPRs,
    defaultBranch: repoData.default_branch,
    lastCommitDate: lastCommit?.commit?.committer?.date ?? null,
    lastCommitSha: lastCommit?.sha?.slice(0, 7) ?? null,
    commitCount: null, // Would require paginating /commits — skipped for rate limit
    contributors,
    language: repoData.language,
    topics: repoData.topics ?? [],
    isPrivate: repoData.private,
    isArchived: repoData.archived,
    auditedAt: new Date().toISOString(),
  };
}
