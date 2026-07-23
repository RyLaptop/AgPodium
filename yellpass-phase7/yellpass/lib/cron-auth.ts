// Shared auth check for /api/cron/* routes. Hit by an external pinger
// (e.g. cron-job.org), not by Vercel Cron — see PROGRESS.md for why.
// Accepts either `Authorization: Bearer <CRON_SECRET>` or `?secret=<CRON_SECRET>`
// since some free cron pingers can't set custom headers.
export function isAuthorizedCronRequest(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // fail closed if not configured

  const header = req.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;

  const url = new URL(req.url);
  return url.searchParams.get("secret") === secret;
}
