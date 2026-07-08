import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { markOverdueBills, generateReceiptNo } from "@/lib/billing";

export async function GET(req: NextRequest) {
  await markOverdueBills();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "PENDING_OR_OVERDUE";

  const where =
    status === "ALL"
      ? {}
      : status === "PENDING_OR_OVERDUE"
      ? { status: { in: ["PENDING", "OVERDUE"] } }
      : { status };

  const bills = await prisma.bill.findMany({
    where,
    orderBy: { dueDate: "asc" },
    include: {
      inmate: { include: { bed: { include: { room: true } } } },
      payment: true,
    },
  });

  return NextResponse.json({ bills });
}

const schema = z.object({
  billId: z.string(),
  amountPaid: z.number().min(0),
  mode: z.string().min(1),
  recordedBy: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const bill = await prisma.bill.findUnique({ where: { id: parsed.data.billId }, include: { payment: true } });
  if (!bill) return NextResponse.json({ error: "Bill not found." }, { status: 404 });
  if (bill.payment) return NextResponse.json({ error: "Bill already paid." }, { status: 400 });

  const receiptNo = await generateReceiptNo();

  const payment = await prisma.payment.create({
    data: {
      billId: bill.id,
      amountPaid: parsed.data.amountPaid,
      mode: parsed.data.mode,
      receiptNo,
      recordedBy: parsed.data.recordedBy || null,
    },
  });

  await prisma.bill.update({ where: { id: bill.id }, data: { status: "PAID" } });

  return NextResponse.json({ payment });
}
