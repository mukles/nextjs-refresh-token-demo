export function normalizeBangladeshMobile(value: string) {
  const compact = value.replace(/[\s()-]/g, "");

  if (compact.startsWith("+880")) return `0${compact.slice(4)}`;
  if (compact.startsWith("880")) return `0${compact.slice(3)}`;

  return compact;
}

export function isValidBangladeshMobile(value: string) {
  return /^01[3-9]\d{8}$/.test(normalizeBangladeshMobile(value));
}
