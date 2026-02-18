import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email")?.trim();

  if (!email) {
    return NextResponse.json({ error: "email query parameter is required." }, { status: 400 });
  }

  const orders = await prisma.order.findMany({
    where: { email },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      type: true,
      status: true,
      amount: true,
      currency: true,
      email: true,
      scanRunId: true,
      repoUrl: true,
      items: true,
      paidAt: true,
      createdAt: true,
    },
  });

  const parsed = orders.map((order) => ({
    ...order,
    items: parseItems(order.items),
  }));

  return NextResponse.json({ orders: parsed });
}

function parseItems(raw: string): string[] {
  try {
    const result = JSON.parse(raw);
    return Array.isArray(result) ? result : [];
  } catch {
    return [];
  }
}
