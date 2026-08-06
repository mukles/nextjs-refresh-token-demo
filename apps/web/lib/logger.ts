type LogDetails = Record<string, boolean | number | string | null | undefined>;

function write(
  level: "error" | "info" | "warn",
  scope: string,
  message: string,
  details?: LogDetails,
) {
  if (process.env.NODE_ENV === "production") return;

  const output = details
    ? [`[${scope}] ${message}`, details]
    : [`[${scope}] ${message}`];
  console[level](...output);
}

export const logger = {
  info(scope: string, message: string, details?: LogDetails) {
    write("info", scope, message, details);
  },
  warn(scope: string, message: string, details?: LogDetails) {
    write("warn", scope, message, details);
  },
  error(scope: string, message: string, details?: LogDetails) {
    write("error", scope, message, details);
  },
};
