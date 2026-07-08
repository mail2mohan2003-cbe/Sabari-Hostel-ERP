import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const checkoutDate = body.checkoutDate ? new Date(body.checkoutDate) : new Date();

  const inmate = await prisma.inmate.findUnique({ where: { id } });
  if (!inmate) {
    return NextResponse.json({ error: "Inmate not found." }, { status: 404 });
  }

  await prisma.inmate.update({
    where: { id },
    data: { status: "CHECKED_OUT", actualCheckoutDate: checkoutDate },
  });

  return NextResponse.json({ ok: true });
}
