import OpenAI from "openai";
import { Confidence, FindingSource, Severity } from "@prisma/client";
import type { ScanFindingInput } from "@/lib/scanner";

export type AiFindingInput = ScanFindingInput & { source: FindingSource };

export type AiScanResult = {
  findings: AiFindingInput[];
  summary: string;
};

const MAX_FILES_FOR_AI = 30;
const MAX_CONTENT_CHARS = 60_000;

const SYSTEM_PROMPT = `You are a senior application security engineer performing a code review.
Analyze the provided source code files for security vulnerabilities.

Focus on:
- Hardcoded credentials, API keys, tokens, passwords
- SQL injection, XSS, command injection
- Insecure cryptographic practices
- Path traversal, SSRF, open redirects
- Overly permissive CORS, access control misconfigurations
- Unsafe deserialization, prototype pollution
- Sensitive data exposure in logs or error messages

Rules:
- Only report issues you have HIGH or MEDIUM confidence in
- Do NOT report issues already covered by the provided rule-based findings
- Provide actionable, specific hints — not generic advice
- Keep riskSummary under 120 characters
- Keep hint under 200 characters
- If no new issues found, return empty findings array`;

const FINDING_SCHEMA = {
  type: "object" as const,
  properties: {
    findings: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          severity: { type: "string" as const, enum: ["CRITICAL", "WARNING"] },
          location: { type: "string" as const },
          riskSummary: { type: "string" as const },
          hint: { type: "string" as const },
          confidence: { type: "string" as const, enum: ["HIGH", "MEDIUM", "LOW"] },
        },
        required: ["severity", "location", "riskSummary", "hint", "confidence"],
        additionalProperties: false,
      },
    },
    summary: { type: "string" as const },
  },
  required: ["findings", "summary"],
  additionalProperties: false,
};

function buildUserPrompt(
  files: { path: string; content: string }[],
  ruleFindings: ScanFindingInput[]
): string {
  const ruleSection =
    ruleFindings.length > 0
      ? `\n\nAlready detected by rule-based scanner (do NOT duplicate):\n${ruleFindings.map((f) => `- [${f.severity}] ${f.location}: ${f.riskSummary}`).join("\n")}`
      : "";

  const fileSection = files
    .map((f) => `--- ${f.path} ---\n${f.content}`)
    .join("\n\n");

  return `Analyze these repository files for security issues.${ruleSection}\n\nFiles:\n${fileSection}`;
}

function truncateFiles(
  files: { path: string; content: string }[]
): { path: string; content: string }[] {
  const selected: { path: string; content: string }[] = [];
  let totalChars = 0;

  const prioritized = [...files].sort((a, b) => {
    const aScore = priorityScore(a.path);
    const bScore = priorityScore(b.path);
    return bScore - aScore;
  });

  for (const file of prioritized) {
    if (selected.length >= MAX_FILES_FOR_AI) break;
    if (totalChars + file.content.length > MAX_CONTENT_CHARS) {
      const remaining = MAX_CONTENT_CHARS - totalChars;
      if (remaining > 500) {
        selected.push({ path: file.path, content: file.content.slice(0, remaining) });
        totalChars += remaining;
      }
      break;
    }
    selected.push(file);
    totalChars += file.content.length;
  }

  return selected;
}

function priorityScore(path: string): number {
  const lower = path.toLowerCase();
  if (lower.includes("auth") || lower.includes("login") || lower.includes("session")) return 10;
  if (lower.includes("api") || lower.includes("route") || lower.includes("handler")) return 9;
  if (lower.includes("middleware")) return 8;
  if (lower.includes("config") || lower.includes("env")) return 7;
  if (lower.includes("db") || lower.includes("prisma") || lower.includes("query")) return 6;
  if (lower.endsWith(".ts") || lower.endsWith(".js")) return 3;
  return 1;
}

function parseAiResponse(raw: { findings: Array<Record<string, string>>; summary: string }): AiScanResult {
  const findings: AiFindingInput[] = raw.findings.map((f) => ({
    severity: f.severity === "CRITICAL" ? Severity.CRITICAL : Severity.WARNING,
    location: f.location,
    riskSummary: f.riskSummary.slice(0, 200),
    hint: f.hint.slice(0, 300),
    confidence: f.confidence === "HIGH" ? Confidence.HIGH : f.confidence === "MEDIUM" ? Confidence.MEDIUM : Confidence.LOW,
    source: FindingSource.AI,
  }));

  return { findings, summary: raw.summary };
}

export async function aiAnalyzeFiles(
  files: { path: string; content: string }[],
  ruleFindings: ScanFindingInput[]
): Promise<AiScanResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { findings: [], summary: "" };
  }

  const openai = new OpenAI({ apiKey });
  const truncated = truncateFiles(files);

  if (truncated.length === 0) {
    return { findings: [], summary: "No files to analyze." };
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.1,
    max_tokens: 4096,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "security_scan_result",
        strict: true,
        schema: FINDING_SCHEMA,
      },
    },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(truncated, ruleFindings) },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    return { findings: [], summary: "" };
  }

  const parsed = JSON.parse(content) as { findings: Array<Record<string, string>>; summary: string };
  return parseAiResponse(parsed);
}
