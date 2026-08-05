export type Step = 0 | 1;

export interface ApiErrorResponse {
  error?: string;
}

export interface VerifyOtpResponse extends ApiErrorResponse {
  message?: string;
}
