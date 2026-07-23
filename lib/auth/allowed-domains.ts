/**
 * Optional email domain allowlist.
 * Reads NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS (comma-separated).
 * Leave unset/blank to allow any email domain.
 */
export function getAllowedDomains(): string[] {
  const raw = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS ?? "";
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
  if (allowed.length === 0) return true; // no allowlist configured = open to anyone
  return allowed.some((d) => domain === d || domain.endsWith(`.${d}`));
}