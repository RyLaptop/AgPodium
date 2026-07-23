export const AVATAR_OPTIONS = [
  { key: "🐱", bg: "bg-orange-100",  label: "Cat" },
  { key: "🐶", bg: "bg-yellow-100",  label: "Dog" },
  { key: "🦊", bg: "bg-amber-100",   label: "Fox" },
  { key: "🐸", bg: "bg-green-100",   label: "Frog" },
  { key: "🦋", bg: "bg-purple-100",  label: "Butterfly" },
  { key: "🚀", bg: "bg-blue-100",    label: "Rocket" },
  { key: "🌵", bg: "bg-teal-100",    label: "Cactus" },
  { key: "🎸", bg: "bg-pink-100",    label: "Guitar" },
  { key: "🦁", bg: "bg-yellow-200",  label: "Lion" },
  { key: "🐧", bg: "bg-slate-100",   label: "Penguin" },
  { key: "🐼", bg: "bg-gray-100",    label: "Panda" },
  { key: "🦄", bg: "bg-pink-100",    label: "Unicorn" },
  { key: "🐉", bg: "bg-red-100",     label: "Dragon" },
  { key: "🦅", bg: "bg-sky-100",     label: "Eagle" },
  { key: "🐺", bg: "bg-gray-200",    label: "Wolf" },
  { key: "🐨", bg: "bg-slate-100",   label: "Koala" },
  { key: "🌙", bg: "bg-indigo-100",  label: "Moon" },
  { key: "⭐", bg: "bg-yellow-100",  label: "Star" },
  { key: "🔥", bg: "bg-orange-100",  label: "Fire" },
  { key: "🌊", bg: "bg-cyan-100",    label: "Wave" },
  { key: "🎯", bg: "bg-red-100",     label: "Target" },
  { key: "🎮", bg: "bg-purple-100",  label: "Controller" },
  { key: "🏆", bg: "bg-yellow-100",  label: "Trophy" },
  { key: "💀", bg: "bg-gray-100",    label: "Skull" },
  { key: "🌺", bg: "bg-rose-100",    label: "Hibiscus" },
  { key: "🍄", bg: "bg-red-100",     label: "Mushroom" },
  { key: "⚡", bg: "bg-yellow-100",  label: "Lightning" },
  { key: "🎲", bg: "bg-green-100",   label: "Dice" },
  { key: "🦝", bg: "bg-gray-100",    label: "Raccoon" },
  { key: "🐙", bg: "bg-pink-100",    label: "Octopus" },
] as const;

const BG_MAP: Record<string, string> = Object.fromEntries(
  AVATAR_OPTIONS.map((o) => [o.key, o.bg])
);

const SIZE = {
  sm: { wrap: "w-7 h-7",  emoji: "text-sm",   init: "text-xs"  },
  md: { wrap: "w-10 h-10", emoji: "text-xl",   init: "text-sm"  },
  lg: { wrap: "w-20 h-20", emoji: "text-4xl",  init: "text-2xl" },
};

export function UserAvatar({
  avatarUrl,
  name,
  size = "sm",
}: {
  avatarUrl?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const s = SIZE[size];
  const bg = avatarUrl ? BG_MAP[avatarUrl] : null;

  if (avatarUrl && bg) {
    return (
      <div className={`${s.wrap} ${bg} rounded-full flex items-center justify-center shrink-0 select-none`}>
        <span className={s.emoji}>{avatarUrl}</span>
      </div>
    );
  }

  const initials =
    name.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase() || "?";

  return (
    <div className={`${s.wrap} bg-gray-200 rounded-full flex items-center justify-center shrink-0 select-none`}>
      <span className={`font-medium text-gray-600 ${s.init}`}>{initials}</span>
    </div>
  );
}
