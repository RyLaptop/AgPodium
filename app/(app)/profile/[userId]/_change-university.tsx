import { UNIVERSITIES } from "@/lib/university";
import type { University } from "@/lib/university";
import { changeUniversity } from "./actions";

type Props = {
  currentUni: University;
  lockedUntil: Date | null;
};

export function ChangeUniversitySection({ currentUni, lockedUntil }: Props) {
  const now = new Date();
  const isLocked = lockedUntil !== null && lockedUntil > now;
  const daysRemaining = isLocked && lockedUntil
    ? Math.ceil((lockedUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const unlockDateStr = lockedUntil
    ? lockedUntil.toLocaleDateString([], { month: "long", day: "numeric" })
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
          You can switch universities again in{" "}
          <span className="font-medium text-gray-600">
            {daysRemaining} day{daysRemaining !== 1 ? "s" : ""}
          </span>
          {unlockDateStr ? ` (${unlockDateStr})` : ""}.
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
          <p className="text-xs text-gray-400 w-full">
            After switching, you won&apos;t be able to change again for 30 days.
          </p>
        </form>
      )}
    </section>
  );
}
