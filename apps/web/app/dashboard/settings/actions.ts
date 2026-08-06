"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerBackendTransport } from "@/lib/backend-server";
import { updateStudentProfile } from "@/lib/student-profile";

const profileSchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name must be at most 80 characters"),
});

export type ProfileFormState = {
  status: "idle" | "success" | "error";
  message: string;
  errors?: {
    name?: string[];
  };
};

export async function updateProfileAction(
  _previousState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the highlighted field.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const transport = await createServerBackendTransport();
  const result = await updateStudentProfile(transport, parsed.data);

  if (!result.ok) {
    return {
      status: "error",
      message:
        result.status === 401
          ? "Your session expired. Please sign in again."
          : result.error.message,
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");

  return {
    status: "success",
    message: "Profile updated successfully.",
  };
}
