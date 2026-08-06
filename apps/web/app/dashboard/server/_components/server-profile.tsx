import type { BackendResult } from "@/lib/backend";
import type { StudentProfile } from "@/types/student-profile";

export function ServerProfile({
  result,
}: {
  result: BackendResult<StudentProfile>;
}) {
  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      {result.ok ? (
        <dl className="grid gap-3">
          <div>
            <dt className="text-sm text-muted-foreground">Name</dt>
            <dd className="font-medium">{result.data.name}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Mobile</dt>
            <dd className="font-medium">{result.data.mobileNumber}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Verified</dt>
            <dd className="font-medium">
              {result.data.mobileVerified ? "Yes" : "No"}
            </dd>
          </div>
        </dl>
      ) : (
        <div role="alert">
          <p className="font-medium text-destructive">
            Could not load the server-rendered profile
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {result.error.message}
          </p>
        </div>
      )}
    </section>
  );
}
