import "server-only";

import { connection } from "next/server";
import { createServerBackendTransport } from "@/lib/backend-server";
import { fetchStudentProfile } from "@/lib/student-profile";

export async function getServerProfile() {
  // Profile data depends on the incoming request's auth cookies. Stop static
  // prerendering before reading runtime configuration or calling the API.
  await connection();
  const transport = await createServerBackendTransport();
  return fetchStudentProfile(transport);
}
