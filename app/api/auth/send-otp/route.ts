import { NextRequest, NextResponse } from "next/server";
import { sendOtp } from "@/lib/api-client";

export async function POST(req: NextRequest) {
  try {
    const { mobileNumber } = (await req.json()) as { mobileNumber?: string };
    if (!mobileNumber) {
      return NextResponse.json({ error: "mobileNumber is required" }, { status: 400 });
    }
    const data = await sendOtp(mobileNumber);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send OTP";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
