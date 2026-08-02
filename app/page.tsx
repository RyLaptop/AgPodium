import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { UniSelector } from "./_uni-selector";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ switch?: string }>;
}) {
  const jar = await cookies();
  const { switch: sw } = await searchParams;
  if (jar.get("uni")?.value && !sw) redirect("/dashboard");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-10 text-center">

        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <svg width="64" height="64" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="10" r="4.5" fill="#3B82F6"/>
            <line x1="40" y1="14.5" x2="40" y2="22" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M14 22 L66 22 L60 36 L20 36 Z" fill="#0F172A"/>
            <line x1="26" y1="30" x2="54" y2="30" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M30 36 L50 36 L47 62 L33 62 Z" fill="#0F172A"/>
            <path d="M22 62 L58 62 L60 70 L20 70 Z" fill="#0F172A"/>
          </svg>
          <div>
            <h1 className="text-4xl font-bold tracking-tight" style={{ letterSpacing: "-0.03em" }}>
              <span className="text-gray-900">Uni</span><span className="text-blue-500">Podium</span>
            </h1>
            <p className="text-gray-500 text-sm mt-1.5">Cross-campus speaker platform</p>
          </div>
        </div>

        {/* Selector */}
        <UniSelector />

        <p className="text-xs text-gray-400 pb-2">
          Your university selection is saved for future visits.
        </p>
      </div>
    </div>
  );
}
