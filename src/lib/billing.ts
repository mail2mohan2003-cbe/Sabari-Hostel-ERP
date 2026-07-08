import { prisma } from "./prisma";

export const EB_RATE_PER_UNIT = 14; // Rs per unit, as configured by the hostel

// Any PENDING bill whose due date has passed is flagged OVERDUE. Called
// opportunistically from the dashboard and payments APIs so the status is
// always fresh without needing a background cron job.
export async function markOverdueBills() {
  const now = new Date();
  await prisma.bill.updateMany({
    where: { status: "PENDING", dueDate: { lt: now } },
    data: { status: "OVERDUE" },
  });
}

function dueDateForReading(readingDate: Date) {
  // Electricity for a given reading is billed to inmates and due by the 5th
  // of the following month (matches the hostel's "pay by the 5th" rule).
  const due = new Date(readingDate.getFullYear(), readingDate.getMonth() + 1, 5);
  return due;
}

function monthLabel(date: Date) {
  return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export async function recordEbReadingAndGenerateBills(
  roomId: number,
  previousReading: number,
  currentReading: number,
  readingDate: Date
) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      beds: { include: { inmates: { where: { status: "ACTIVE" } } } },
    },
  });

  if (!room) throw new Error("Room not found");

  const unitsConsumed = Math.max(0, currentReading - previousReading);
  const totalAmount = Math.round(unitsConsumed * EB_RATE_PER_UNIT * 100) / 100;

  // The reading stored for next time is always the current (latest) reading.
  const ebReading = await prisma.eBReading.create({
    data: { roomId, reading: currentReading, readingDate },
  });

  const activeInmates = room.beds
    .flatMap((b) => b.inmates)
    .filter((i) => i.status === "ACTIVE");

  if (activeInmates.length === 0 || totalAmount === 0) {
    return {
      ebReading,
      bills: [],
      unitsConsumed,
      totalAmount,
      note: "No active inmates or zero consumption - no bill generated.",
    };
  }

  const perHead = Math.round((totalAmount / activeInmates.length) * 100) / 100;
  const dueDate = dueDateForReading(readingDate);
  const periodLabel = `${monthLabel(readingDate)} - Electricity (Room ${room.number})`;

  const bills = await Promise.all(
    activeInmates.map((inmate) =>
      prisma.bill.create({
        data: {
          inmateId: inmate.id,
          ebReadingId: ebReading.id,
          type: "ELECTRICITY",
          periodLabel,
          unitsConsumed,
          ratePerUnit: EB_RATE_PER_UNIT,
          amount: perHead,
          dueDate,
          status: "PENDING",
        },
      })
    )
  );

  return { ebReading, bills, unitsConsumed, totalAmount, perHead };
}

export async function generateReceiptNo() {
  const count = await prisma.payment.count();
  const year = new Date().getFullYear();
  return `SSLH/${year}/${String(count + 1).padStart(5, "0")}`;
}
