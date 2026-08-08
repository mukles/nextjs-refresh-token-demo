import { applyDecorators } from "@nestjs/common";
import { Transform } from "class-transformer";
import { Matches } from "class-validator";

const BANGLADESH_MOBILE = /^01[3-9]\d{8}$/;

export function normalizeBangladeshMobile(value: string) {
  const compact = value.replace(/[\s()-]/g, "");

  if (compact.startsWith("+880")) return `0${compact.slice(4)}`;
  if (compact.startsWith("880")) return `0${compact.slice(3)}`;

  return compact;
}

export function isValidBangladeshMobile(value: string) {
  return BANGLADESH_MOBILE.test(normalizeBangladeshMobile(value));
}

/** Normalizes `+880`/`880`/spacing into `01XXXXXXXXX`, then validates it. */
export function IsBangladeshMobile() {
  return applyDecorators(
    Transform(({ value }: { value: unknown }) =>
      typeof value === "string" ? normalizeBangladeshMobile(value) : value,
    ),
    Matches(BANGLADESH_MOBILE, {
      message: "Enter a valid Bangladesh mobile number",
    }),
  );
}
