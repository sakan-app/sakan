/**
 * Turns any thrown value into a short, user-showable diagnostic code.
 *
 * The goal is that a failing checkout no longer says only "something went
 * wrong": the toast also carries the underlying code (HTTP status, Stripe
 * error code, storage error), which is what makes the failure fixable.
 */
export function errorCode(error: unknown): string {
  if (!error) return "unknown_error";

  const anyErr = error as {
    message?: unknown;
    status?: unknown;
    statusCode?: unknown;
    code?: unknown;
    error?: unknown;
    body?: unknown;
  };

  const parts: string[] = [];
  const status = anyErr.status ?? anyErr.statusCode;
  if (typeof status === "number" || typeof status === "string") parts.push(`HTTP ${status}`);
  if (typeof anyErr.code === "string" && anyErr.code) parts.push(anyErr.code);

  const message =
    typeof anyErr.message === "string"
      ? anyErr.message
      : typeof error === "string"
        ? error
        : typeof anyErr.error === "string"
          ? anyErr.error
          : "";
  if (message) parts.push(message);

  const text = parts.filter(Boolean).join(" · ").slice(0, 220);
  return text || "unknown_error";
}
