import { UNIVERSITIES } from "@/lib/university";
import type { University } from "@/lib/university";
import { changeUniversity } from "./actions";

type Props = {
  currentUni: University;
  isAdmin: boolean;
  switchesRemaining: number;
  windowReset: Date | null;
};

export function ChangeUniversitySection({ currentUni, isAdmin, switchesRemaining, windowReset }: Props) {
  const isLocked = !isAdmin && switchesRemaining === 0;
  const resetDateStr = windowReset
    ? windowReset.toLocaleDateString([], { month: "long", day: "numeric" })
    : null;

  return (
    <section className="border border-gray-200 rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">University</h3>

      <p className="text-sm text-gray-600">
        Currently on{" "}
        <span className="font-semibold text-gray-900">
          {UNIVERSITIES[currentUni].label} UniPodium
        </span>
        .
      </p>

      {isLocked ? (
        <p className="text-xs text-gray-400">
          You&apos;ve used both switches for this 30-day window.
          {resetDateStr && (
            <> You can switch again on <span className="font-medium text-gray-600">{resetDateStr}</span>.</>
          )}
        </p>
      ) : (
        <form action={changeUniversity} className="flex items-center gap-3 flex-wrap">
          <select
            name="uni"
            defaultValue={currentUni}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white"
          >
            <option value="tamu">Texas A&M University</option>
            <option value="lsu">Louisiana State University</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-brand text-white text-sm rounded-lg hover:bg-brand-dark transition"
          >
            Switch
          </button>
          {isAdmin ? (
            <p className="text-xs text-gray-400 w-full">Admins can switch campuses freely.</p>
          ) : (
            <p className="text-xs text-gray-400 w-full">
              {switchesRemaining === 2
                ? "You can switch up to 2 times per 30 days."
                : `${switchesRemaining} switch remaining this 30-day window${resetDateStr ? ` (resets ${resetDateStr})` : ""}.`}
            </p>
          )}
        </form>
      )}
    </section>
  );
}
