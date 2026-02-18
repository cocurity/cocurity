import { Confidence, Severity } from "@prisma/client";

export const SCAN_CONFIG_VERSION = "v1";
const MAX_FILES_SCANNED = 200;
const MAX_FETCHED_TEXT_BYTES = 2 * 1024 * 1024;
const MAX_SINGLE_FILE_BYTES = 256 * 1024;

const SENSITIVE_FILENAME_PATTERNS = [
  /(^|\/)\.env(\..*)?$/i,
  /\.pem$/i,
  /(^|\/)keystore(\.|$)/i,
  /(^|\/)credentials(\.|$)/i,
  /(^|\/)serviceAccount[^/]*\.json$/i,
];

const SECRET_PATTERNS = [
  { regex: /\bsk-[A-Za-z0-9\-_]{12,}\b/g, label: "sk-" },
  { regex: /\bAKIA[0-9A-Z]{16}\b/g, label: "AKIA" },
  { regex: /BEGIN\s+PRIVATE\s+KEY/gi, label: "BEGIN PRIVATE KEY" },
  { regex: /\bMNEMONIC\b/gi, label: "MNEMONIC" },
  { regex: /\bPRIVATE_KEY\b/gi, label: "PRIVATE_KEY" },
];

const RISKY_CONFIG_PATTERNS = [
  /Access-Control-Allow-Origin\s*:\s*\*/gi,
  /\bcors\s*:\s*\*/gi,
  /\bpublicRead\b/gi,
  /\ballow all\b/gi,
];

/* ── File context classification (Phase 1 FP reduction) ─────────────── */

const SAFE_TEMPLATE_SUFFIXES = [".example", ".sample", ".template", ".dist", ".defaults"];

const DOC_FILE_PATTERNS = [
  /\.md$/i,
  /\.mdx$/i,
  /\.rst$/i,
  /(^|\/)README(\.[^/]+)?$/i,
  /(^|\/)CHANGELOG(\.[^/]+)?$/i,
  /(^|\/)CONTRIBUTING(\.[^/]+)?$/i,
  /(^|\/)LICENSE(\.[^/]+)?$/i,
];

const TEXT_EXTENSIONS = new Set([
  "txt",
  "md",
  "json",
  "yaml",
  "yml",
  "toml",
  "ini",
  "env",
  "js",
  "mjs",
  "cjs",
  "ts",
  "tsx",
  "jsx",
  "py",
  "rb",
  "go",
  "java",
  "kt",
  "swift",
  "php",
  "rs",
  "c",
  "h",
  "cpp",
  "cs",
  "xml",
  "properties",
  "conf",
  "config",
  "gradle",
  "sql",
  "sh",
  "bash",
  "zsh",
  "ps1",
  "dockerfile",
  "gitignore",
  "npmrc",
]);

export type ScanFindingInput = {
  severity: Severity;
  location: string;
  riskSummary: string;
  hint: string;
  confidence: Confidence;
};

type ParsedRepo = { owner: string; repo: string; canonicalRepoUrl: string };
type GitHubTreeItem = { path: string; mode: string; type: string; sha: string; size?: number };

export class ScanError extends Error {
  status: number;
  code: string;
  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = "ScanError";
    this.code = code;
    this.status = status;
  }
}

export function parseGitHubRepoUrl(repoUrl: string): ParsedRepo {
  let parsed: URL;
  try {
    parsed = new URL(repoUrl);
  } catch {
    throw new ScanError("INVALID_REPO_URL", "Invalid repository URL. Use a public GitHub URL.", 400);
  }

  if (parsed.hostname !== "github.com") {
    throw new ScanError("INVALID_REPO_URL", "Invalid repository URL. Only github.com public repos are supported.", 400);
  }

  const segments = parsed.pathname.split("/").filter(Boolean);
  if (segments.length < 2) {
    throw new ScanError("INVALID_REPO_URL", "Invalid repository URL. Expected format: https://github.com/owner/repo", 400);
  }

  const owner = segments[0];
  const repo = segments[1].replace(/\.git$/i, "");
  if (!owner || !repo) {
    throw new ScanError("INVALID_REPO_URL", "Invalid repository URL. Expected format: https://github.com/owner/repo", 400);
  }

  return {
    owner,
    repo,
    canonicalRepoUrl: `https://github.com/${owner}/${repo}`,
  };
}

function githubHeaders() {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "launchpass-mvp-scanner",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

async function githubJson<T>(url: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { headers: githubHeaders(), cache: "no-store" });
  } catch {
    throw new ScanError("GITHUB_FETCH_FAILED", "Could not reach GitHub. Please retry shortly.", 502);
  }

  if (response.status === 403 && response.headers.get("x-ratelimit-remaining") === "0") {
    throw new ScanError("RATE_LIMITED", "GitHub rate limit reached. Please try again later.", 429);
  }
  if (response.status === 404) {
    throw new ScanError("GITHUB_FETCH_FAILED", "Repository not found or not publicly accessible.", 404);
  }
  if (!response.ok) {
    throw new ScanError("GITHUB_FETCH_FAILED", "Failed to fetch repository data from GitHub.", 502);
  }

  return (await response.json()) as T;
}

async function githubText(url: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(url, { headers: githubHeaders(), cache: "no-store" });
  } catch {
    throw new ScanError("GITHUB_FETCH_FAILED", "Could not fetch repository file contents from GitHub.", 502);
  }

  if (response.status === 403 && response.headers.get("x-ratelimit-remaining") === "0") {
    throw new ScanError("RATE_LIMITED", "GitHub rate limit reached. Please try again later.", 429);
  }
  if (!response.ok) {
    throw new ScanError("GITHUB_FETCH_FAILED", "Failed while reading repository files from GitHub.", 502);
  }

  return response.text();
}

export async function fetchDefaultBranchAndCommit(owner: string, repo: string) {
  const repoMeta = await githubJson<{ default_branch?: string }>(
    `https://api.github.com/repos/${owner}/${repo}`
  );
  const defaultBranch = repoMeta.default_branch;
  if (!defaultBranch) {
    throw new ScanError("GITHUB_FETCH_FAILED", "Could not determine repository default branch.", 502);
  }

  const commit = await githubJson<{ sha?: string }>(
    `https://api.github.com/repos/${owner}/${repo}/commits/${encodeURIComponent(defaultBranch)}`
  );
  const commitHash = commit.sha;
  if (!commitHash) {
    throw new ScanError("GITHUB_FETCH_FAILED", "Could not determine repository latest commit hash.", 502);
  }

  return { defaultBranch, commitHash };
}

async function fetchRepositoryTree(owner: string, repo: string, commitHash: string): Promise<GitHubTreeItem[]> {
  const tree = await githubJson<{ tree?: GitHubTreeItem[]; truncated?: boolean }>(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${commitHash}?recursive=1`
  );

  if (!tree.tree) {
    throw new ScanError("GITHUB_FETCH_FAILED", "Could not read repository file tree.", 502);
  }
  if (tree.truncated) {
    throw new ScanError(
      "OVERSIZED_REPO",
      "Repository is too large to scan in MVP mode. Please try a smaller repository.",
      413
    );
  }

  return tree.tree.filter((item) => item.type === "blob");
}

function isSensitivePath(path: string) {
  return SENSITIVE_FILENAME_PATTERNS.some((pattern) => pattern.test(path));
}

function isTemplateFile(path: string) {
  const lower = path.toLowerCase();
  return SAFE_TEMPLATE_SUFFIXES.some((suffix) => lower.endsWith(suffix));
}

function isDocFile(path: string) {
  return DOC_FILE_PATTERNS.some((pattern) => pattern.test(path));
}

function isLikelyTextPath(path: string) {
  const file = path.split("/").pop() ?? "";
  const lower = file.toLowerCase();
  if (lower === "dockerfile") return true;
  if (lower.endsWith(".env") || lower.startsWith(".env")) return true;
  const ext = lower.includes(".") ? lower.split(".").pop() ?? "" : lower;
  return TEXT_EXTENSIONS.has(ext);
}

function buildRawContentUrl(owner: string, repo: string, commitHash: string, path: string) {
  return `https://raw.githubusercontent.com/${owner}/${repo}/${commitHash}/${encodeURIComponent(path).replace(/%2F/g, "/")}`;
}

function maskSecretLikeStrings(text: string) {
  let masked = text;
  for (const { regex } of SECRET_PATTERNS) {
    masked = masked.replace(regex, "[REDACTED_SECRET]");
  }
  return masked;
}

function addFinding(
  findings: ScanFindingInput[],
  dedupe: Set<string>,
  finding: ScanFindingInput
) {
  const key = `${finding.severity}|${finding.location}|${finding.riskSummary}`;
  if (dedupe.has(key)) return;
  dedupe.add(key);
  findings.push(finding);
}

export async function scanGitHubRepository(repoUrl: string) {
  const parsed = parseGitHubRepoUrl(repoUrl);
  const { defaultBranch, commitHash } = await fetchDefaultBranchAndCommit(parsed.owner, parsed.repo);
  const tree = await fetchRepositoryTree(parsed.owner, parsed.repo, commitHash);
  const candidates = tree.filter((item) => isSensitivePath(item.path) || isLikelyTextPath(item.path));

  if (candidates.length > MAX_FILES_SCANNED) {
    throw new ScanError(
      "OVERSIZED_REPO",
      "Repository exceeds MVP scan limits (max 200 files). Please scan a smaller repository.",
      413
    );
  }

  const findings: ScanFindingInput[] = [];
  const fetchedFiles: { path: string; content: string }[] = [];
  const dedupe = new Set<string>();
  let fetchedBytes = 0;

  for (const file of candidates) {
    const location = file.path;
    const template = isTemplateFile(location);
    const doc = isDocFile(location);

    if (isSensitivePath(location) && !template) {
      addFinding(findings, dedupe, {
        severity: Severity.CRITICAL,
        location,
        riskSummary: "Sensitive file naming pattern suggests potential credential exposure risk.",
        hint: "Store sensitive assets in dedicated secret management systems outside source control.",
        confidence: Confidence.MEDIUM,
      });
    }

    if (!isLikelyTextPath(location)) {
      continue;
    }

    if ((file.size ?? 0) > MAX_SINGLE_FILE_BYTES) {
      continue;
    }

    const rawUrl = buildRawContentUrl(parsed.owner, parsed.repo, commitHash, location);
    const content = await githubText(rawUrl);
    const bytes = Buffer.byteLength(content, "utf8");
    fetchedBytes += bytes;
    if (fetchedBytes > MAX_FETCHED_TEXT_BYTES) {
      throw new ScanError(
        "OVERSIZED_REPO",
        "Repository content exceeds MVP scan limits (max 2MB text). Please scan a smaller repository.",
        413
      );
    }

    fetchedFiles.push({ path: location, content });
    const sanitized = maskSecretLikeStrings(content);

    for (const pattern of SECRET_PATTERNS) {
      pattern.regex.lastIndex = 0;
      if (pattern.regex.test(sanitized)) {
        addFinding(findings, dedupe, {
          severity: template ? Severity.WARNING : Severity.CRITICAL,
          location,
          riskSummary: template
            ? `Secret-like token pattern (${pattern.label}) found in template file — verify no real credentials are committed.`
            : `Secret-like token pattern (${pattern.label}) detected in repository content.`,
          hint: "Keep secrets in dedicated secret stores and rotate potentially exposed credentials.",
          confidence: template ? Confidence.LOW : Confidence.HIGH,
        });
      }
    }

    if (!doc) {
      for (const pattern of RISKY_CONFIG_PATTERNS) {
        pattern.lastIndex = 0;
        if (pattern.test(sanitized)) {
          addFinding(findings, dedupe, {
            severity: Severity.WARNING,
            location,
            riskSummary: "Risky configuration pattern may allow broader access than intended.",
            hint: "Apply least-privilege defaults and validate security-sensitive configuration scope.",
            confidence: Confidence.MEDIUM,
          });
        }
      }
    }
  }

  return {
    canonicalRepoUrl: parsed.canonicalRepoUrl,
    defaultBranch,
    commitHash,
    scanConfigVersion: SCAN_CONFIG_VERSION,
    findings,
    fetchedFiles,
  };
}

export function formatScanError(error: unknown) {
  if (error instanceof ScanError) {
    return { status: error.status, message: error.message };
  }
  if (error instanceof Error) {
    return { status: 500, message: "Unexpected scan error. Please retry shortly." };
  }

  return { status: 500, message: "Unexpected scan error. Please retry shortly." };
}
