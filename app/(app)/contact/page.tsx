import { ContactForm } from "./_form";

export default function ContactPage() {
  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Contact</h1>
        <p className="text-gray-500 text-sm mt-1">
          Send a message directly to the UniPodium admin team.
        </p>
      </div>
      <ContactForm />
    </div>
  );
}
