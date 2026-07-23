export function reminderEmail({
  recipientName,
  orgName,
  meetingTitle,
  startsAt,
  location,
  hoursOut,
}: {
  recipientName: string;
  orgName: string;
  meetingTitle: string;
  startsAt: string;
  location: string | null;
  hoursOut: 24 | 1;
}) {
  const when = new Date(startsAt).toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  });
  const label = hoursOut === 24 ? "tomorrow" : "in about an hour";
  const subject = `Reminder: you're speaking at ${orgName} ${label}`;
  const html = `
    <p>Hi ${recipientName},</p>
    <p>Reminder — you're approved to speak at <strong>${orgName}</strong>'s meeting
    "<strong>${meetingTitle}</strong>" ${label}.</p>
    <p><strong>When:</strong> ${when}<br/>
    <strong>Where:</strong> ${location ?? "TBD"}</p>
    <p>— AgPodium</p>
  `;
  return { subject, html };
}
