import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id")?.trim();

  if (!sessionId) {
    return NextResponse.json({ error: "session_id is required." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { stripeSessionId: sessionId },
    select: {
      type: true,
      status: true,
      amount: true,
      currency: true,
      items: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  let items: string[] = [];
  try {
    const parsed = JSON.parse(order.items);
    items = Array.isArray(parsed) ? parsed : [];
  } catch {
    items = [];
  }

  return NextResponse.json({
    type: order.type,
    status: order.status,
    amount: order.amount,
    currency: order.currency,
    items,
  });
}
