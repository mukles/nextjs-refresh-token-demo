"use client";

import { useCallback } from "react";
import { Loader2, Save, UserRoundPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/auth-context";
import { useMutation } from "@/hooks/use-mutation";
import { type ProfileFormState, updateProfileAction } from "../actions";

const initialState: ProfileFormState = {
  status: "idle",
  message: "",
};

type ProfileFormProps = {
  user: { id: string; name: string; mobile: string };
};

export function ProfileForm({ user }: ProfileFormProps) {
  const { refreshUser } = useAuth();
  const handleSuccess = useCallback(() => {
    void refreshUser();
  }, [refreshUser]);

  const {
    state,
    mutate: formAction,
    isPending,
  } = useMutation(updateProfileAction, initialState, {
    onSuccess: handleSuccess,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserRoundPen className="size-4" />
          Personal information
        </CardTitle>
        <CardDescription>
          Your mobile number identifies this demo account and cannot be changed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5" action={formAction}>
          <div className="grid gap-2">
            <Label htmlFor="profile-name">Display name</Label>
            <Input
              id="profile-name"
              name="name"
              defaultValue={user.name}
              minLength={2}
              maxLength={80}
              disabled={isPending}
              aria-invalid={Boolean(state.errors?.name)}
              aria-describedby={
                state.errors?.name ? "profile-name-error" : undefined
              }
              required
            />
            {state.errors?.name && (
              <p id="profile-name-error" className="text-sm text-destructive">
                {state.errors.name[0]}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="profile-mobile">Mobile number</Label>
            <Input id="profile-mobile" value={user.mobile} disabled />
          </div>
          <Button className="w-fit" disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : <Save />}
            Save profile
          </Button>
          {state.status === "error" && !state.errors?.name && (
            <p
              className="text-sm text-destructive"
              role="alert"
              aria-live="polite"
            >
              {state.message}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
