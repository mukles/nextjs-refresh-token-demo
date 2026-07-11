import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE } from "@/lib/auth";
import { apiClientFetch } from "@/lib/api-client";

export const runtime = "nodejs";

export type StudentProfile = {
  _id: string;
  name: string;
  mobileNumber: string;
  mobileVerified: boolean;
  image: string | null;
  profileCompleted: boolean;
  isActive: boolean;
  gender: string;
  address: { district?: string };
  institution: { _id: string; institutionShortName: string } | null;
  activeClass: { _id: string; name: string } | null;
  class: { class: string; className: string }[];
  trial: {
    status: string;
    startedAt: string;
    expiresAt: string;
    expiredAt: string;
  } | null;
};

export async function GET(req: NextRequest) {
  const accessToken = req.cookies.get(ACCESS_COOKIE)?.value;
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const backendRes = await apiClientFetch("/students/profile", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!backendRes.ok) {
    const err = await backendRes.json().catch(() => ({}));
    return NextResponse.json(err, { status: backendRes.status });
  }

  const profile = (await backendRes.json()) as StudentProfile;
  return NextResponse.json(profile);
}
