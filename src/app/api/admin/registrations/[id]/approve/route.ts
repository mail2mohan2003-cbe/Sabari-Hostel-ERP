import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";
import { sendWhatsApp, sendSms } from "@/lib/sms";

const schema = z.object({
  bedId: z.number(),
  advanceAmount: z.number().min(0),
  joinDate: z.string().min(1),
  expectedCheckoutDate: z.string().optional().nullable(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }
  const { bedId, advanceAmount, joinDate, expectedCheckoutDate } = parsed.data;

  const registration = await prisma.registrationRequest.findUnique({ where: { id } });
  if (!registration) {
    return NextResponse.json({ error: "Registration not found." }, { status: 404 });
  }
  if (registration.status !== "PENDING") {
    return NextResponse.json({ error: "Registration already processed." }, { status: 400 });
  }

  const bed = await prisma.bed.findUnique({
    where: { id: bedId },
    include: { room: true, inmates: { where: { status: "ACTIVE" } } },
  });
  if (!bed) {
    return NextResponse.json({ error: "Selected bed not found." }, { status: 404 });
  }
  if (bed.inmates.length > 0) {
    return NextResponse.json({ error: "Selected bed is already occupied." }, { status: 400 });
  }

  const inmate = await prisma.inmate.create({
    data: {
      registrationId: registration.id,
      fullName: registration.fullName,
      dob: registration.dob,
      mobile: registration.mobile,
      email: registration.email,
      fatherMotherName: registration.fatherMotherName,
      fatherMotherMobile: registration.fatherMotherMobile,
      permanentAddress: registration.permanentAddress,
      foodPreference: registration.foodPreference,
      bedId: bed.id,
      advanceAmount,
      joinDate: new Date(joinDate),
      expectedCheckoutDate: expectedCheckoutDate ? new Date(expectedCheckoutDate) : null,
      guardians: {
        create: [
          {
            type: "PARENT",
            name: registration.fatherMotherName,
            phone: registration.fatherMotherMobile,
          },
          ...(registration.localGuardianName
            ? [
                {
                  type: "LOCAL_GUARDIAN",
                  name: registration.localGuardianName,
                  phone: registration.localGuardianContact || undefined,
                },
              ]
            : []),
          {
            type: "EMERGENCY_CONTACT",
            name: registration.emergencyContactName,
            relation: registration.emergencyContactRelation,
            phone: registration.emergencyContactPhone,
          },
        ],
      },
    },
    include: { guardians: true, bed: { include: { room: true } } },
  });

  await prisma.registrationRequest.update({
    where: { id: registration.id },
    data: { status: "APPROVED" },
  });

  const roomLabel = `Room ${bed.room.number}, Bed ${bed.label}`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  const inmateHtml = `<p>Dear ${inmate.fullName},</p>
<p>Your registration at Sri Sabari Ladies Hostel has been confirmed.</p>
<p><b>Room / Bed:</b> ${roomLabel}<br/>
<b>Date of Joining:</b> ${new Date(joinDate).toLocaleDateString("en-IN")}</p>
<p>Please contact the hostel office for any queries.</p>`;

  const guardianHtml = `<p>Dear Parent/Guardian,</p>
<p>This is to confirm that <b>${inmate.fullName}</b> has been registered and allotted
<b>${roomLabel}</b> at Sri Sabari Ladies Hostel, effective ${new Date(joinDate).toLocaleDateString("en-IN")}.</p>
<p>Contact: 94437 66661 / 97891 56616<br/>${appUrl}</p>`;

  const notifications: Promise<unknown>[] = [];
  if (inmate.email) notifications.push(sendMail(inmate.email, "Hostel Registration Confirmed", inmateHtml));

  for (const g of inmate.guardians) {
    const message = `Sri Sabari Ladies Hostel: ${inmate.fullName} has been registered and allotted ${roomLabel}, effective ${new Date(joinDate).toLocaleDateString("en-IN")}. Contact: 94437 66661.`;
    if (g.email) notifications.push(sendMail(g.email, "Hostel Registration Confirmed", guardianHtml));
    if (g.phone) {
      notifications.push(sendWhatsApp(g.phone, message));
      notifications.push(sendSms(g.phone, message));
    }
  }

  await Promise.allSettled(notifications);

  return NextResponse.json({ inmate });
}
