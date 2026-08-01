import { AmbassadorForm } from "./_form";

export const dynamic = "force-dynamic";

export default function AmbassadorPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Become a Campus Ambassador</h1>
        <p className="text-gray-600 mt-2">
          Want to bring UniPodium to your campus? We partner with student leaders who can help launch
          the platform at their university. Tell us about yourself and the orgs you&apos;re involved with.
        </p>
      </div>

      <div className="border border-blue-100 bg-blue-50 rounded-lg px-4 py-3 text-sm text-blue-800">
        Ambassadors get early access, direct support from the UniPodium team, and help shape the product for their school.
      </div>

      <AmbassadorForm />
    </div>
  );
}
