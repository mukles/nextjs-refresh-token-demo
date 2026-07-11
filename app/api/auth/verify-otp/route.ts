import { NextRequest, NextResponse } from "next/server";
import { verifyOtp } from "@/lib/api-client";
import { setAccessCookie, setRefreshCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { mobileNumber, otp } = (await req.json()) as {
      mobileNumber?: string;
      otp?: string;
    };

    if (!mobileNumber || !otp) {
      return NextResponse.json(
        { error: "mobileNumber and otp are required" },
        { status: 400 },
      );
    }

    const data = await verifyOtp(mobileNumber, otp);

    const res = NextResponse.json({ success: true, message: data.message });
    setAccessCookie(res, data.data.accessToken);
    setRefreshCookie(res, data.data.refreshToken);

    return res;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "OTP verification failed";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
