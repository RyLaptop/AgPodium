import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full text-center space-y-6">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-brand">
          AgPodium
        </h1>
        <p className="text-lg text-gray-700">
          Speak at any org&apos;s meeting without the email chain. Post events
          to the bulletin. Coordinate across campus.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-brand text-white rounded-lg hover:bg-brand-dark transition"
          >
            Sign in
          </Link>
        </div>
        <p className="text-sm text-gray-500">Now open to everyone.</p>
      </div>
    </main>
  );
}
