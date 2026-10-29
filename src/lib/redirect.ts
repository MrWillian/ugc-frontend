export const RETURN_TO_PARAM = "next";

/** Only same-origin paths; anything else (absolute or protocol-relative URLs) would be an open redirect. */
export function safeRedirectPath(value: string | null, fallback = "/dashboard"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  return value;
}
