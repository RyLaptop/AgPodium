/**
 * TAMU email domain allowlist.
 * Reads NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS (comma-separated).
 * Defaults to tamu.edu.
 */
export function getAllowedDomains(): string[] {
  const raw = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS ?? "tamu.edu";
  return raw
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailAllowed(email: string): boolean {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf("@");
  if (at < 0) return false;
  const domain = trimmed.slice(at + 1);
  const allowed = getAllowedDomains();
  return allowed.some((d) => domain === d || domain.endsWith(`.${d}`));
}
