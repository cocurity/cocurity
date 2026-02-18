import { NextResponse } from "next/server";

type GitHubUser = { email?: string | null; html_url?: string };
type GitHubCommit = { commit?: { author?: { email?: string } } };

function githubHeaders() {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "cocurity-scanner",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

function isUsableEmail(email: string | undefined | null): email is string {
  if (!email) return false;
  if (email.includes("noreply")) return false;
  return email.includes("@");
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ owner: string }> },
) {
  const { owner } = await params;
  const { searchParams } = new URL(request.url);
  const repo = searchParams.get("repo") ?? owner;

  if (!owner || owner.length > 100) {
    return NextResponse.json({ error: "Invalid owner." }, { status: 400 });
  }

  const headers = githubHeaders();

  try {
    const userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(owner)}`, {
      headers,
      cache: "no-store",
    });

    if (!userRes.ok) {
      return NextResponse.json({ email: null, profileUrl: `https://github.com/${owner}` });
    }

    const user = (await userRes.json()) as GitHubUser;

    if (isUsableEmail(user.email)) {
      return NextResponse.json({ email: user.email, profileUrl: user.html_url });
    }
  } catch {}

  try {
    const commitsRes = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?author=${encodeURIComponent(owner)}&per_page=5`,
      { headers, cache: "no-store" },
    );

    if (!commitsRes.ok) {
      return NextResponse.json({ email: null, profileUrl: `https://github.com/${owner}` });
    }

    const commits = (await commitsRes.json()) as GitHubCommit[];
    for (const c of commits) {
      if (isUsableEmail(c.commit?.author?.email)) {
        return NextResponse.json({ email: c.commit!.author!.email, profileUrl: `https://github.com/${owner}` });
      }
    }
  } catch {}

  return NextResponse.json({ email: null, profileUrl: `https://github.com/${owner}` });
}
