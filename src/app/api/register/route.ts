import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const mobileRegex = /^[6-9]\d{9}$/;
const loosePhoneRegex = /^\d{6,15}$/;

const mobileField = z
  .string()
  .transform((v) => v.replace(/[\s-]/g, "").replace(/^\+?91/, ""))
  .refine((v) => mobileRegex.test(v), { message: "Enter a valid 10-digit mobile number." });

const optionalLoosePhone = z
  .string()
  .optional()
  .or(z.literal(""))
  .refine((v) => !v || loosePhoneRegex.test(v.replace(/[\s-]/g, "").replace(/^\+/, "")), {
    message: "Enter a valid phone number.",
  });

const schema = z.object({
  fullName: z.string().min(2, "Full name is required."),
  dob: z.string().min(1, "Date of birth is required.").refine((v) => new Date(v) <= new Date(), {
    message: "Date of birth cannot be in the future.",
  }),
  mobile: mobileField,
  email: z.string().email("Enter a valid email address.").optional().or(z.literal("")),
  fatherMotherName: z.string().min(2, "Father/Mother name is required."),
  fatherMotherMobile: mobileField,
  permanentAddress: z.string().min(5, "Enter the full permanent address."),
  occupationType: z.string().min(1),
  institutionAddress: z.string().min(2, "College/Institute/Company address is required."),
  institutionPhone: optionalLoosePhone,
  localGuardianName: z.string().optional().or(z.literal("")),
  localGuardianContact: optionalLoosePhone,
  localGuardianAddress: z.string().optional().or(z.literal("")),
  emergencyContactName: z.string().min(2, "Emergency contact name is required."),
  emergencyContactRelation: z.string().min(1, "Relation is required."),
  emergencyContactPhone: mobileField,
  foodPreference: z.string().min(1),
  addressProof: z.string().min(2, "Address proof type is required."),
  idProof: z.string().min(2, "ID proof type is required."),
  preferredJoiningDate: z.string().min(1, "Preferred date of joining is required."),
  expectedDurationMonths: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || (Number.isInteger(Number(v)) && Number(v) >= 1), {
      message: "Enter a whole number of months (1 or more).",
    }),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please fill all required fields correctly." },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const registration = await prisma.registrationRequest.create({
    data: {
      fullName: data.fullName,
      dob: new Date(data.dob),
      mobile: data.mobile,
      email: data.email || null,
      fatherMotherName: data.fatherMotherName,
      fatherMotherMobile: data.fatherMotherMobile,
      permanentAddress: data.permanentAddress,
      occupationType: data.occupationType,
      institutionAddress: data.institutionAddress,
      institutionPhone: data.institutionPhone || null,
      localGuardianName: data.localGuardianName || null,
      localGuardianContact: data.localGuardianContact || null,
      localGuardianAddress: data.localGuardianAddress || null,
      emergencyContactName: data.emergencyContactName,
      emergencyContactRelation: data.emergencyContactRelation,
      emergencyContactPhone: data.emergencyContactPhone,
      foodPreference: data.foodPreference,
      addressProof: data.addressProof,
      idProof: data.idProof,
      preferredJoiningDate: new Date(data.preferredJoiningDate),
      expectedDurationMonths: data.expectedDurationMonths
        ? Number(data.expectedDurationMonths)
        : null,
    },
  });

  return NextResponse.json({ id: registration.id }, { status: 201 });
}
