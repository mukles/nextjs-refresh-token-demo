import "server-only";

import { createServerBackendTransport } from "@/lib/backend-server";
import { fetchStudentProfile } from "@/lib/student-profile";

export async function getServerProfile() {
  const transport = await createServerBackendTransport();
  return fetchStudentProfile(transport);
}
