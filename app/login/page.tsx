import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

type Props = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

const ALLOWED_PATHS = ["/mypage", "/pricing", "/scan", "/gift"];

function resolveRedirectTo(callbackUrl?: string): string {
  if (!callbackUrl) return "/mypage";
  try {
    const url = new URL(callbackUrl, "http://localhost");
    if (ALLOWED_PATHS.some((p) => url.pathname.startsWith(p))) {
      return url.pathname + url.search;
    }
  } catch {
    void 0;
  }
  return "/mypage";
}

export default async function LoginPage({ searchParams }: Props) {
  const session = await auth();
  const { callbackUrl } = await searchParams;
  const redirectTo = resolveRedirectTo(callbackUrl);

  if (session?.user) redirect(redirectTo);

  return (
    <main className="flex min-h-[60vh] items-center justify-center">
      <section className="co-noise-card w-full max-w-md rounded-2xl p-8 text-center">
        <p className="lp-badge">Sign in</p>
        <h1 className="mt-4 text-2xl font-semibold text-slate-100">
          Welcome to Cocurity
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          Sign in with your GitHub account to track scans, fix requests, and
          certificates.
        </p>

        <form
          className="mt-8"
          action={async () => {
            "use server";
            await signIn("github", { redirectTo });
          }}
        >
          <button
            type="submit"
            className="lp-button lp-button-primary inline-flex w-full items-center justify-center gap-2"
          >
            <svg
              className="h-5 w-5"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z"
                clipRule="evenodd"
              />
            </svg>
            Continue with GitHub
          </button>
        </form>

        <p className="mt-6 text-xs text-slate-400">
          By signing in, you agree to our terms of service.
        </p>

        <Link
          href="/"
          className="mt-4 inline-block text-sm text-slate-300 no-underline hover:text-cyan-200"
        >
          &larr; Back to home
        </Link>
      </section>
    </main>
  );
}
