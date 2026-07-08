import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "PENDING";

  const registrations = await prisma.registrationRequest.findMany({
    where: status === "ALL" ? {} : { status },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ registrations });
}
