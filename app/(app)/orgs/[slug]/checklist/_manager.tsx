"use client";

import { useState, useEffect, useTransition } from "react";
import { addChecklistItem, deleteChecklistItem, toggleCompletion } from "./actions";

type Item = { id: string; label: string; sort_order: number };
type Member = { user_id: string; full_name: string | null; email: string };

export function ChecklistManager({ orgId, orgSlug, isStaff, items, members, completionSet: initialCompletions, currentUserId }: {
  orgId: string; orgSlug: string; isStaff: boolean;
  items: Item[]; members: Member[]; completionSet: string[]; currentUserId: string;
}) {
  const [completions, setCompletions] = useState(new Set(initialCompletions));

  useEffect(() => {
    setCompletions(new Set(initialCompletions));
  }, [initialCompletions]);

  const isCompleted = (userId: string, itemId: string) => completions.has(`${userId}:${itemId}`);

  if (!isStaff) {
    const count = items.filter((item) => isCompleted(currentUserId, item.id)).length;
    const total = items.length;
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600">{count} of {total} items completed</p>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div className="bg-brand h-2 rounded-full transition-all" style={{ width: `${total > 0 ? Math.round((count / total) * 100) : 0}%` }} />
        </div>
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className={`flex items-center gap-3 p-3 rounded-lg border ${isCompleted(currentUserId, item.id) ? "border-green-200 bg-green-50" : "border-gray-200"}`}>
              <span className={`text-lg leading-none ${isCompleted(currentUserId, item.id) ? "text-green-500" : "text-gray-300"}`}>
                {isCompleted(currentUserId, item.id) ? "✓" : "○"}
              </span>
              <span className="text-sm">{item.label}</span>
            </li>
          ))}
        </ul>
        {total === 0 && <p className="text-sm text-gray-500">No checklist items yet.</p>}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AddItemForm orgId={orgId} orgSlug={orgSlug} />

      {items.length === 0 ? (
        <p className="text-sm text-gray-500">No checklist items yet. Add one above.</p>
      ) : (
        <>
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Items</h2>
            <ul className="space-y-2">
              {items.map((item) => (
                <ItemRow key={item.id} item={item} orgId={orgId} orgSlug={orgSlug} />
              ))}
            </ul>
          </div>

          {members.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Member Progress</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left py-2 pr-6 font-medium text-gray-700 whitespace-nowrap">Member</th>
                      {items.map((item) => (
                        <th key={item.id} className="text-center py-2 px-2 font-medium text-gray-700 max-w-24">
                          <span className="block truncate text-xs" title={item.label}>{item.label}</span>
                        </th>
                      ))}
                      <th className="text-center py-2 px-2 font-medium text-gray-700 whitespace-nowrap">Done</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => {
                      const completedCount = items.filter((item) => isCompleted(member.user_id, item.id)).length;
                      return (
                        <tr key={member.user_id} className="border-t border-gray-100">
                          <td className="py-2 pr-6 font-medium whitespace-nowrap">
                            {member.full_name ?? member.email.split("@")[0]}
                          </td>
                          {items.map((item) => (
                            <td key={item.id} className="text-center py-2 px-2">
                              <ToggleCell
                                itemId={item.id}
                                targetUserId={member.user_id}
                                orgId={orgId}
                                orgSlug={orgSlug}
                                completed={isCompleted(member.user_id, item.id)}
                                onToggle={(val) => {
                                  setCompletions((prev) => {
                                    const next = new Set(prev);
                                    const key = `${member.user_id}:${item.id}`;
                                    if (val) next.add(key); else next.delete(key);
                                    return next;
                                  });
                                }}
                              />
                            </td>
                          ))}
                          <td className="text-center py-2 px-2 text-xs text-gray-500 whitespace-nowrap">
                            {completedCount}/{items.length}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AddItemForm({ orgId, orgSlug }: { orgId: string; orgSlug: string }) {
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    startTransition(async () => {
      setError(null);
      const res = await addChecklistItem(orgId, orgSlug, label);
      if (!res.ok) { setError(res.error); return; }
      setLabel("");
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="New checklist item…"
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        />
        <button
          onClick={submit}
          disabled={pending || !label.trim()}
          className="px-4 py-2 bg-brand text-white rounded-lg text-sm hover:bg-brand-dark disabled:opacity-60"
        >
          {pending ? "Adding…" : "Add item"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

function ItemRow({ item, orgId, orgSlug }: { item: Item; orgId: string; orgSlug: string }) {
  const [pending, startTransition] = useTransition();
  const del = () => {
    if (!confirm(`Delete "${item.label}"?`)) return;
    startTransition(async () => { await deleteChecklistItem(item.id, orgId, orgSlug); });
  };
  return (
    <li className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2">
      <span className="text-sm">{item.label}</span>
      <button onClick={del} disabled={pending} className="text-xs text-red-500 hover:underline disabled:opacity-50 ml-3 shrink-0">
        {pending ? "…" : "Delete"}
      </button>
    </li>
  );
}

function ToggleCell({ itemId, targetUserId, orgId, orgSlug, completed, onToggle }: {
  itemId: string; targetUserId: string; orgId: string; orgSlug: string;
  completed: boolean; onToggle: (val: boolean) => void;
}) {
  const [pending, startTransition] = useTransition();
  const toggle = () => {
    const next = !completed;
    onToggle(next);
    startTransition(async () => {
      const res = await toggleCompletion(itemId, targetUserId, orgId, orgSlug, next);
      if (!res.ok) onToggle(!next);
    });
  };
  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={`w-6 h-6 rounded border-2 flex items-center justify-center mx-auto transition-colors ${
        completed ? "bg-green-500 border-green-500 text-white" : "border-gray-300 hover:border-green-400"
      } disabled:opacity-50`}
    >
      {completed && <span className="text-xs leading-none">✓</span>}
    </button>
  );
}
