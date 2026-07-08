import { NextResponse } from "next/server";
import { getCurrentOccupancy } from "@/lib/forecast";

export async function GET() {
  const occupancy = await getCurrentOccupancy();
  return NextResponse.json({ rooms: occupancy.perRoom });
}
