export const ORG_TAGS = [
  "Greek", "Men/Women Org", "FLO", "SLO", "Service",
  "Pre Health", "Social", "Pre Law", "Professional", "Hobby", "Sports",
  "Cultural", "Academic", "Religion", "Advocacy", "Art", "Performance",
  "Student Government", "Honor Society", "Research", "Military", "Media",
] as const;

export const TAG_COLORS: Record<string, { label: string; pill: string; active: string; border: string }> = {
  "Greek":            { label: "🏛️ Greek",            pill: "bg-purple-100 text-purple-700", active: "bg-purple-600 text-white border-purple-600", border: "border-purple-300 text-purple-600 hover:border-purple-500" },
  "Men/Women Org":    { label: "👥 Men/Women Org",    pill: "bg-blue-100 text-blue-700",     active: "bg-blue-600 text-white border-blue-600",     border: "border-blue-300 text-blue-600 hover:border-blue-500" },
  "FLO":              { label: "🌱 FLO",              pill: "bg-orange-100 text-orange-700", active: "bg-orange-500 text-white border-orange-500", border: "border-orange-300 text-orange-600 hover:border-orange-500" },
  "SLO":              { label: "🌿 SLO",              pill: "bg-teal-100 text-teal-700",     active: "bg-teal-600 text-white border-teal-600",     border: "border-teal-300 text-teal-600 hover:border-teal-500" },
  "Service":          { label: "🤲 Service",          pill: "bg-green-100 text-green-700",   active: "bg-green-600 text-white border-green-600",   border: "border-green-300 text-green-600 hover:border-green-500" },
  "Pre Health":       { label: "🩺 Pre Health",       pill: "bg-rose-100 text-rose-700",     active: "bg-rose-600 text-white border-rose-600",     border: "border-rose-300 text-rose-600 hover:border-rose-500" },
  "Social":           { label: "🎉 Social",           pill: "bg-pink-100 text-pink-700",     active: "bg-pink-500 text-white border-pink-500",     border: "border-pink-300 text-pink-600 hover:border-pink-500" },
  "Pre Law":          { label: "⚖️ Pre Law",          pill: "bg-indigo-100 text-indigo-700", active: "bg-indigo-600 text-white border-indigo-600", border: "border-indigo-300 text-indigo-600 hover:border-indigo-500" },
  "Professional":     { label: "💼 Professional",     pill: "bg-slate-100 text-slate-600",   active: "bg-slate-600 text-white border-slate-600",   border: "border-slate-300 text-slate-600 hover:border-slate-500" },
  "Hobby":            { label: "🎮 Hobby",            pill: "bg-amber-100 text-amber-700",   active: "bg-amber-500 text-white border-amber-500",   border: "border-amber-300 text-amber-600 hover:border-amber-500" },
  "Sports":           { label: "🏅 Sports",           pill: "bg-lime-100 text-lime-700",     active: "bg-lime-600 text-white border-lime-600",     border: "border-lime-300 text-lime-600 hover:border-lime-500" },
  "Cultural":         { label: "🌍 Cultural",         pill: "bg-yellow-100 text-yellow-700", active: "bg-yellow-500 text-white border-yellow-500", border: "border-yellow-300 text-yellow-600 hover:border-yellow-500" },
  "Academic":         { label: "📚 Academic",         pill: "bg-sky-100 text-sky-700",       active: "bg-sky-600 text-white border-sky-600",       border: "border-sky-300 text-sky-600 hover:border-sky-500" },
  "Religion":         { label: "🙏 Religion",         pill: "bg-violet-100 text-violet-700", active: "bg-violet-600 text-white border-violet-600", border: "border-violet-300 text-violet-600 hover:border-violet-500" },
  "Advocacy":         { label: "📣 Advocacy",         pill: "bg-red-100 text-red-700",       active: "bg-red-600 text-white border-red-600",       border: "border-red-300 text-red-600 hover:border-red-500" },
  "Art":              { label: "🎨 Art",              pill: "bg-fuchsia-100 text-fuchsia-700", active: "bg-fuchsia-500 text-white border-fuchsia-500", border: "border-fuchsia-300 text-fuchsia-600 hover:border-fuchsia-500" },
  "Performance":      { label: "🎭 Performance",      pill: "bg-emerald-100 text-emerald-700", active: "bg-emerald-600 text-white border-emerald-600", border: "border-emerald-300 text-emerald-600 hover:border-emerald-500" },
  "Student Government": { label: "🗳️ Student Government", pill: "bg-cyan-100 text-cyan-700", active: "bg-cyan-600 text-white border-cyan-600",    border: "border-cyan-300 text-cyan-600 hover:border-cyan-500" },
  "Honor Society":    { label: "🎓 Honor Society",    pill: "bg-yellow-100 text-yellow-800", active: "bg-yellow-600 text-white border-yellow-600", border: "border-yellow-400 text-yellow-700 hover:border-yellow-600" },
  "Research":         { label: "🔬 Research",         pill: "bg-zinc-100 text-zinc-600",     active: "bg-zinc-600 text-white border-zinc-600",     border: "border-zinc-300 text-zinc-600 hover:border-zinc-500" },
  "Military":         { label: "🎖️ Military",         pill: "bg-stone-100 text-stone-600",   active: "bg-stone-600 text-white border-stone-600",   border: "border-stone-300 text-stone-600 hover:border-stone-500" },
  "Media":            { label: "📰 Media",            pill: "bg-orange-100 text-orange-700", active: "bg-orange-500 text-white border-orange-500", border: "border-orange-300 text-orange-600 hover:border-orange-500" },
};

export function tagPill(tag: string) {
  return TAG_COLORS[tag]?.pill ?? "bg-gray-100 text-gray-600";
}

export function tagLabel(tag: string) {
  return TAG_COLORS[tag]?.label ?? tag;
}
