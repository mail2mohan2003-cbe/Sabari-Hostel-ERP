import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { markOverdueBills } from "@/lib/billing";

const schema = z.object({
  bedId: z.number().optional(),
  expectedCheckoutDate: z.string().optional().nullable(),
});

// Full profile for the occupant detail view: original registration answers,
// guardians, current room/bed, and every bill (with payment/receipt info).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await markOverdueBills();

  const inmate = await prisma.inmate.findUnique({
    where: { id },
    include: {
      registration: true,
      guardians: true,
      bed: { include: { room: true } },
      bills: { orderBy: { dueDate: "desc" }, include: { payment: true } },
    },
  });

  if (!inmate) {
    return NextResponse.json({ error: "Inmate not found." }, { status: 404 });
  }

  return NextResponse.json({ inmate });
}

// Update an already-active inmate: transfer them to a different room/bed
// and/or change their tentative exit date. Both are optional and independent.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const inmate = await prisma.inmate.findUnique({ where: { id } });
  if (!inmate) {
    return NextResponse.json({ error: "Inmate not found." }, { status: 404 });
  }
  if (inmate.status !== "ACTIVE") {
    return NextResponse.json({ error: "Inmate is not currently active." }, { status: 400 });
  }

  const data: { bedId?: number; expectedCheckoutDate?: Date | null } = {};

  if (parsed.data.bedId !== undefined && parsed.data.bedId !== inmate.bedId) {
    const targetBed = await prisma.bed.findUnique({
      where: { id: parsed.data.bedId },
      include: { inmates: { where: { status: "ACTIVE" } } },
    });
    if (!targetBed) {
      return NextResponse.json({ error: "Selected bed not found." }, { status: 404 });
    }
    if (targetBed.inmates.length > 0) {
      return NextResponse.json({ error: "Selected bed is already occupied." }, { status: 400 });
    }
    data.bedId = targetBed.id;
  }

  if (parsed.data.expectedCheckoutDate !== undefined) {
    data.expectedCheckoutDate = parsed.data.expectedCheckoutDate
      ? new Date(parsed.data.expectedCheckoutDate)
      : null;
  }

  const updated = await prisma.inmate.update({
    where: { id },
    data,
    include: { bed: { include: { room: true } } },
  });

  return NextResponse.json({ inmate: updated });
}
