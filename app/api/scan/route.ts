import { NextResponse } from "next/server";
import { createOrReuseScan } from "@/lib/scan-service";
import { formatScanError, parseGitHubRepoUrl } from "@/lib/scanner";

type ScanRequestBody = { repoUrl?: string };

export async function POST(request: Request) {
  let body: ScanRequestBody;
  try {
    body = (await request.json()) as ScanRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const repoUrl = body.repoUrl?.trim();
  if (!repoUrl) {
    return NextResponse.json({ error: "repoUrl is required." }, { status: 400 });
  }

  try {
    parseGitHubRepoUrl(repoUrl);
    const scanId = await createOrReuseScan(repoUrl);
    return NextResponse.json({ scanId });
  } catch (error) {
    const formatted = formatScanError(error);
    return NextResponse.json({ error: formatted.message }, { status: formatted.status });
  }
}
