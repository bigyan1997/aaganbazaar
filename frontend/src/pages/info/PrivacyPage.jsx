export default function PrivacyPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <h1 className="text-2xl font-semibold text-navy">Privacy Policy</h1>

      <section className="flex flex-col gap-1.5">
        <h2 className="font-medium text-navy">What we collect</h2>
        <p className="text-sm text-navy/70">
          Your name, email, phone number, and shipping address when you create an account or place an
          order. If you apply to sell, we also collect your store details. We don't collect payment
          card numbers directly - eSewa and Khalti handle those on their own secure systems.
        </p>
      </section>

      <section className="flex flex-col gap-1.5">
        <h2 className="font-medium text-navy">How we use it</h2>
        <p className="text-sm text-navy/70">
          To process orders, deliver them to the right address, let sellers fulfill what you bought,
          and send account-related emails (order updates, verification, password resets). We don't
          sell your data to third parties.
        </p>
      </section>

      <section className="flex flex-col gap-1.5">
        <h2 className="font-medium text-navy">What sellers can see</h2>
        <p className="text-sm text-navy/70">
          A seller you order from can see your shipping details and contact information for that
          order, so they can fulfill and deliver it. They don't see your account password, payment
          details, or orders placed with other sellers.
        </p>
      </section>

      <section className="flex flex-col gap-1.5">
        <h2 className="font-medium text-navy">Your account</h2>
        <p className="text-sm text-navy/70">
          You can review and update your details from your account page at any time. To request
          deletion of your account, contact us and we'll process it, subject to keeping records
          required for completed orders.
        </p>
      </section>

      <p className="text-xs text-navy/50">Last updated {new Date().getFullYear()}.</p>
    </div>
  );
}
