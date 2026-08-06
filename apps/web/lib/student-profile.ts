import { backendFetch, type BackendTransport } from "@/lib/backend";
import type { StudentProfile } from "@/types/student-profile";

export async function fetchStudentProfile(transport: BackendTransport) {
  return backendFetch<StudentProfile>(
    transport,
    "/students/profile",
    undefined,
    "Could not load profile",
  );
}

export async function updateStudentProfile(
  transport: BackendTransport,
  input: { name: string },
) {
  return backendFetch<StudentProfile>(
    transport,
    "/students/profile",
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    "Could not update profile",
  );
}
