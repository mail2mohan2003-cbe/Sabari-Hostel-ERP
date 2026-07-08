import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { recordEbReadingAndGenerateBills } from "@/lib/billing";

export async function GET() {
  const rooms = await prisma.room.findMany({
    orderBy: { number: "asc" },
    include: {
      ebReadings: { orderBy: { readingDate: "desc" }, take: 1 },
      beds: { include: { inmates: { where: { status: "ACTIVE" } } } },
    },
  });

  const result = rooms.map((r) => ({
    roomId: r.id,
    number: r.number,
    lastReading: r.ebReadings[0]?.reading ?? null,
    lastReadingDate: r.ebReadings[0]?.readingDate ?? null,
    activeInmateCount: r.beds.flatMap((b) => b.inmates).length,
  }));

  return NextResponse.json({ rooms: result });
}

const schema = z
  .object({
    roomId: z.number(),
    previousReading: z.number().min(0),
    currentReading: z.number().min(0),
    readingDate: z.string().min(1),
  })
  .refine((v) => v.currentReading >= v.previousReading, {
    message: "Current reading cannot be less than the previous reading.",
    path: ["currentReading"],
  });

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input." },
      { status: 400 }
    );
  }
  try {
    const result = await recordEbReadingAndGenerateBills(
      parsed.data.roomId,
      parsed.data.previousReading,
      parsed.data.currentReading,
      new Date(parsed.data.readingDate)
    );
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to record reading." },
      { status: 400 }
    );
  }
}
