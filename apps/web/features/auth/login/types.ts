export type Step = 0 | 1;

export interface ApiErrorResponse {
  error?: string;
  message?: string;
}

export type VerifyOtpResponse = ApiErrorResponse;
