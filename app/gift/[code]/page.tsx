import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ claimed?: string }>;
};

export default async function GiftRedeemPage({ params, searchParams }: Props) {
  const { code } = await params;
  const search = await searchParams;
  const session = await auth();

  const gift = await prisma.giftCode.findUnique({
    where: { code },
    include: {
      scanRun: {
        select: {
          id: true,
          repoUrl: true,
        },
      },
      claimedBy: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });

  if (!gift) notFound();

  const claimedByCurrentUser = Boolean(session?.user?.id && gift.claimedByUserId === session.user.id);
  const claimedByAnotherUser = Boolean(gift.claimedByUserId && !claimedByCurrentUser);

  async function claimGift() {
    "use server";

    const claimSession = await auth();
    if (!claimSession?.user?.id) {
      redirect(`/login?callbackUrl=${encodeURIComponent(`/gift/${code}`)}`);
    }

    const target = await prisma.giftCode.findUnique({
      where: { code },
      select: { claimedByUserId: true },
    });

    if (!target) {
      redirect("/scan");
    }

    if (target.claimedByUserId && target.claimedByUserId !== claimSession.user.id) {
      redirect(`/gift/${code}`);
    }

    if (!target.claimedByUserId) {
      await prisma.giftCode.update({
        where: { code },
        data: {
          claimedByUserId: claimSession.user.id,
          claimedAt: new Date(),
        },
      });
    }

    redirect(`/gift/${code}?claimed=1`);
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <section className="co-noise-card rounded-2xl p-6">
        <p className="lp-badge">Gift Redeem</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-100">Cocurity Gift Code</h1>
        <p className="mt-2 text-sm text-slate-300">Code: {gift.code}</p>
        <p className="mt-1 text-sm text-slate-300">Repository: {gift.scanRun.repoUrl}</p>

        <div className="mt-4 rounded-xl border border-white/15 bg-white/5 p-4 text-sm text-slate-200">
          <p className="font-semibold text-slate-100">Included benefits</p>
          <ul className="mt-2 space-y-1">
            {gift.includesFix ? <li>- Cocurity Fix Pass</li> : null}
            {gift.includesCert ? <li>- Certification Pass</li> : null}
          </ul>
        </div>

        {search.claimed === "1" && claimedByCurrentUser ? (
          <p className="mt-4 rounded-lg border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-100">
            Gift claimed successfully. You can now use this benefit.
          </p>
        ) : null}

        {claimedByAnotherUser ? (
          <p className="mt-4 rounded-lg border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
            This gift has already been claimed by another account.
          </p>
        ) : null}

        {!session?.user ? (
          <div className="mt-5">
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(`/gift/${code}`)}`}
              className="lp-button lp-button-primary"
            >
              Sign in to claim
            </Link>
          </div>
        ) : null}

        {session?.user && !claimedByAnotherUser && !claimedByCurrentUser ? (
          <form action={claimGift} className="mt-5">
            <button type="submit" className="lp-button lp-button-primary">
              Claim gift
            </button>
          </form>
        ) : null}

        {claimedByCurrentUser ? (
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href={`/scan/${gift.scanRun.id}?mode=audit`} className="lp-button lp-button-primary">
              Open scan result
            </Link>
            <Link href="/mypage" className="lp-button lp-button-ghost">
              Go to my page
            </Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}
