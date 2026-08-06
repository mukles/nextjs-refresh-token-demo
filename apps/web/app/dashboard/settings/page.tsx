"use client";

import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/features/auth/auth-context";
import { ProfileForm } from "./_components/profile-form";

export default function ProfileSettingsPage() {
  const { user } = useAuth();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          Next.js Server Action
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Profile settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Update the profile associated with your authenticated session.
        </p>
      </div>

      {user ? (
        <ProfileForm key={`${user.id}:${user.name}`} user={user} />
      ) : (
        <Card>
          <CardContent className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading profile settings…
          </CardContent>
        </Card>
      )}
    </main>
  );
}
