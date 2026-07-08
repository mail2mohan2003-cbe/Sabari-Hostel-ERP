import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const registration = await prisma.registrationRequest.findUnique({ where: { id } });
  if (!registration) {
    return NextResponse.json({ error: "Registration not found." }, { status: 404 });
  }
  await prisma.registrationRequest.update({
    where: { id },
    data: { status: "REJECTED", rejectionReason: body.reason || null },
  });
  return NextResponse.json({ ok: true });
}
