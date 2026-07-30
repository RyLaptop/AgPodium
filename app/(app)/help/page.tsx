import { HelpQueryForm } from "./_query-form";

const FAQ = [
  {
    q: "How do I join an org?",
    a: "Go to the Orgs page, find the org you want to join, and click the Join button on their page. Your request will be sent to the org's directors for approval.",
  },
  {
    q: "How do I submit a speaking request?",
    a: "Go to the Requests page and click 'New request'. Select the org and meeting you want to speak at, fill in your pitch and how many minutes you need, then submit.",
  },
  {
    q: "Why is my bulletin event still pending?",
    a: "All bulletin events are reviewed by an admin before they go live. This usually takes less than 24 hours. You'll get a notification when it's approved or if it's declined.",
  },
  {
    q: "How do I create an org?",
    a: "Go to the Orgs page and click 'Create org'. Fill in your org's name, slug, and description. It will be reviewed by an admin before appearing publicly.",
  },
  {
    q: "How do I switch campuses?",
    a: "Go to your profile page and use the 'Change campus' section. Regular accounts can switch twice every 30 days.",
  },
  {
    q: "How do I edit or cancel a bulletin event I posted?",
    a: "Go to the Bulletin page, find your event, and click the pencil icon to edit or the X icon to remove it. You can also open the event's detail page for the same options.",
  },
  {
    q: "Why can't I sign in after creating my account?",
    a: "New accounts require admin approval before they can access the platform. Once an admin approves your account you'll be able to sign in normally.",
  },
  {
    q: "How do I message another user?",
    a: "Visit their profile page and click 'Send message request'. They'll receive a notification and can accept or decline. Once accepted, you can chat in the Messages tab.",
  },
];

export default function HelpPage() {
  return (
    <div className="max-w-2xl space-y-10">
      <div>
        <h1 className="text-3xl font-bold">Help &amp; Resources</h1>
        <p className="text-gray-500 text-sm mt-1">
          Answers to common questions, and a way to reach us if you need more help.
        </p>
      </div>

      {/* FAQ */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Frequently asked questions</h2>
        <dl className="space-y-3">
          {FAQ.map((item) => (
            <div key={item.q} className="border border-gray-200 rounded-xl p-4">
              <dt className="font-medium text-gray-900 text-sm">{item.q}</dt>
              <dd className="mt-1 text-sm text-gray-600">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Submit a query */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Still need help?</h2>
          <p className="text-sm text-gray-500 mt-1">
            Submit a query below and an admin will get back to you.
          </p>
        </div>
        <HelpQueryForm />
      </section>
    </div>
  );
}
