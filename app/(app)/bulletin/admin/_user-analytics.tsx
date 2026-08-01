"use client";

type UserRow = { created_at: string; last_sign_in_at: string | null };

const MAU_MS = 30 * 24 * 60 * 60 * 1000;

function monthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return new Date(+y, +m - 1, 1).toLocaleDateString("en-US", { year: "numeric", month: "short" });
}

export function UserAnalytics({ users }: { users: UserRow[] }) {
  const now = Date.now();
  const mau = users.filter((u) => u.last_sign_in_at && now - new Date(u.last_sign_in_at).getTime() < MAU_MS).length;

  // Group new signups by month
  const byMonth = new Map<string, number>();
  for (const u of users) {
    const k = monthKey(u.created_at);
    byMonth.set(k, (byMonth.get(k) ?? 0) + 1);
  }

  const months = [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b));
  let running = 0;
  const rows = months.map(([key, newCount]) => {
    running += newCount;
    return { label: monthLabel(key), new: newCount, total: running };
  }).reverse();

  const thisMonth = rows[0]?.new ?? 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold">{users.length}</p>
          <p className="text-sm text-gray-500 mt-0.5">Total users</p>
        </div>
        <div className="border border-green-200 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{mau}</p>
          <p className="text-sm text-gray-500 mt-0.5">MAU (30 days)</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold">{thisMonth}</p>
          <p className="text-sm text-gray-500 mt-0.5">New this month</p>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Month</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">New users</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <tr key={r.label} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-700">{r.label}</td>
                <td className="px-3 py-2 text-right text-green-600 font-medium">+{r.new}</td>
                <td className="px-3 py-2 text-right text-gray-700">{r.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
