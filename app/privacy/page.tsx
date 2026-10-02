export const metadata = { title: 'Privacy notice — Sisi' };

export default function Privacy() {
  return (
    <main className="mx-auto max-w-prose px-4 py-12">
      <h1 className="font-display text-3xl font-semibold">Privacy notice</h1>
      <p className="mt-1 text-sm text-plum-500">Draft for the pilot. The Sisi team will have this reviewed before launch.</p>
      <div className="mt-6 space-y-4 text-sm leading-relaxed">
        <p><b>What we collect.</b> Your email, your name or nickname, the community you join, your quiz and confidence answers, and your learning activity (lessons, points, badges). Optional budget and savings figures you add are private to you.</p>
        <p><b>What we never ask for.</b> Your ID number, bank account details, or exact income. Please do not share them in chat.</p>
        <p><b>Why.</b> To run Sisi, show you your progress, and help the pilot team understand whether the programme builds money confidence. Pilot reporting uses aggregated activity.</p>
        <p><b>Sharing.</b> Badge cards you choose to share show your first name or nickname and the badge, never money amounts. You can revoke a share link any time in Profile.</p>
        <p><b>Your rights (POPIA).</b> You can export your data or delete your account from Profile. You can ask us to correct your information.</p>
        <p><b>Education only.</b> Sisi provides financial education, not financial advice.</p>
      </div>
    </main>
  );
}
