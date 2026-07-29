export default function TermsPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <h1 className="text-2xl font-semibold text-navy">Terms of Service</h1>

      <section className="flex flex-col gap-1.5">
        <h2 className="font-medium text-navy">1. Using Aaganbazaar</h2>
        <p className="text-sm text-navy/70">
          Aaganbazaar is a marketplace connecting independent Nepali sellers with buyers. Creating an
          account means you agree to provide accurate information and to use the platform lawfully -
          no fraudulent orders, fake reviews, or attempts to circumvent seller verification.
        </p>
      </section>

      <section className="flex flex-col gap-1.5">
        <h2 className="font-medium text-navy">2. Orders and payments</h2>
        <p className="text-sm text-navy/70">
          Prices are set by individual sellers and shown inclusive of any active discount at checkout.
          Payment can be made via eSewa, Khalti, or cash on delivery. Placing an order is a commitment
          to pay for it; sellers may cancel orders that go unpaid or unclaimed.
        </p>
      </section>

      <section className="flex flex-col gap-1.5">
        <h2 className="font-medium text-navy">3. Sellers</h2>
        <p className="text-sm text-navy/70">
          Selling on Aaganbazaar requires an approved seller application. Sellers are responsible for
          the accuracy of their listings, keeping stock levels current, and fulfilling orders within a
          reasonable time. Aaganbazaar may suspend a store for repeated non-fulfillment, misleading
          listings, or fraudulent activity.
        </p>
      </section>

      <section className="flex flex-col gap-1.5">
        <h2 className="font-medium text-navy">4. Returns and refunds</h2>
        <p className="text-sm text-navy/70">
          Refunds are handled between buyer and seller and recorded on the order. If you paid online,
          approved refunds go back to your original payment method.
        </p>
      </section>

      <section className="flex flex-col gap-1.5">
        <h2 className="font-medium text-navy">5. Limitation of liability</h2>
        <p className="text-sm text-navy/70">
          Aaganbazaar facilitates transactions between independent buyers and sellers and is not itself
          the seller of record for marketplace items. We're not liable for disputes arising from
          product quality, shipping delays, or seller conduct beyond our reasonable control.
        </p>
      </section>

      <p className="text-xs text-navy/50">Last updated {new Date().getFullYear()}.</p>
    </div>
  );
}
