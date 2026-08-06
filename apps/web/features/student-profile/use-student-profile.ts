"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { backendErrorMessage, type BackendError } from "@/lib/backend";
import { backendFetchWithAutoRefresh } from "@/lib/backend-client";
import {
  fetchStudentProfile,
  updateStudentProfile,
} from "@/lib/student-profile";
import type { StudentProfile } from "@/types/student-profile";

const clientRequest = async (path: string, init?: RequestInit) => {
  const { res } = await backendFetchWithAutoRefresh(path, init);
  return res;
};

export function useStudentProfile() {
  const { refreshUser, handleAuthFailure } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFailure = useCallback(
    (error: BackendError) => {
      if (error.status === 401) {
        handleAuthFailure(error);
        return;
      }
      setError(error.message);
    },
    [handleAuthFailure],
  );

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchStudentProfile(clientRequest);
      if (!result.ok) {
        handleFailure(result.error);
        return null;
      }
      setProfile(result.data);
      return result.data;
    } catch (error) {
      setError(backendErrorMessage(error, "Could not load profile"));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleFailure]);

  const saveProfile = useCallback(
    async (input: { name: string }) => {
      setIsSaving(true);
      setError(null);
      try {
        const result = await updateStudentProfile(clientRequest, input);
        if (!result.ok) {
          handleFailure(result.error);
          return null;
        }
        setProfile(result.data);
        await refreshUser();
        return result.data;
      } catch (error) {
        setError(backendErrorMessage(error, "Could not update profile"));
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    [handleFailure, refreshUser],
  );

  return {
    profile,
    isLoading,
    isSaving,
    error,
    loadProfile,
    saveProfile,
  };
}
