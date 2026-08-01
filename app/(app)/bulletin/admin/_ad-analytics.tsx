type AdClickRow = { tier: string; variant: string };

const TIERS = [
  { key: "universal", label: "Universal", desc: "Bottom banner — all pages" },
  { key: "premium",   label: "Premium",   desc: "Top banner — dashboard & map" },
  { key: "standard",  label: "Standard",  desc: "Top banner — orgs, bulletin & calendar" },
];

export function AdAnalytics({ clicks }: { clicks: AdClickRow[] }) {
  const byTier: Record<string, number> = {};
  for (const c of clicks) byTier[c.tier] = (byTier[c.tier] ?? 0) + 1;
  const total = clicks.length;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="grid grid-cols-3 divide-x divide-gray-200">
        {TIERS.map((t) => (
          <div key={t.key} className="p-4 text-center">
            <p className="text-3xl font-bold">{byTier[t.key] ?? 0}</p>
            <p className="text-sm font-medium mt-1">{t.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-100 bg-gray-50 px-4 py-2 text-xs text-gray-500">
        {total} total click{total === 1 ? "" : "s"} tracked all-time
      </div>
    </div>
  );
}
