import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const SECTIONS = [
  {
    title: "Ordering & payment",
    items: [
      {
        q: "How do I pay for an order?",
        a: "At checkout you can pay by eSewa, Khalti, or cash on delivery. Card payments aren't offered - these three cover how most Nepali shoppers actually pay.",
      },
      {
        q: "Can I order from more than one seller at once?",
        a: "Yes. Your cart can hold items from different sellers - they're placed as one order and automatically split behind the scenes so each seller ships their own part.",
      },
      {
        q: "Can I change or cancel an order after placing it?",
        a: "Once placed, an order is picked up by the seller for fulfillment. Contact the seller directly (their storefront page has a link) as soon as possible if you need to change or cancel it.",
      },
    ],
  },
  {
    title: "Shipping & delivery",
    items: [
      {
        q: "Where does Aaganbazaar deliver?",
        a: "Anywhere in Nepal. Delivery time and cost depend on the individual seller and your location.",
      },
      {
        q: "How do I track my order?",
        a: "Go to My Account > Orders (or Track order in the footer) to see the status of every order, and the tracking number once a seller has shipped it.",
      },
    ],
  },
  {
    title: "Returns & refunds",
    items: [
      {
        q: "What if something arrives damaged or wrong?",
        a: "Contact the seller from your order detail page. If they agree to a refund, they'll mark the order refunded and you'll see the updated status on that order immediately.",
      },
      {
        q: "How long do refunds take?",
        a: "If you paid online (eSewa/Khalti), the refund goes back to that same payment method once the seller processes it. Cash-on-delivery refunds are arranged directly with the seller.",
      },
      {
        q: "Can I review something I bought?",
        a: "Yes, once an order is marked delivered. Reviews are tied to a real purchase, so only buyers who actually received the item can leave one - it keeps ratings honest.",
      },
    ],
  },
  {
    title: "Selling on Aaganbazaar",
    items: [
      {
        q: "How do I become a seller?",
        a: "Apply from the Sell on Aaganbazaar link - it's a short application, not just a signup checkbox. We review every application before a store goes live.",
      },
      {
        q: "What does it cost to sell?",
        a: "There's no listing fee. Aaganbazaar takes a commission on each sale, deducted automatically - your seller dashboard shows the exact breakdown (subtotal, commission, and net earnings) for every order.",
      },
      {
        q: "How do I manage orders as a seller?",
        a: "Your seller dashboard lists incoming orders. Move each one through confirmed, shipped, and delivered, and add a tracking number once it ships.",
      },
    ],
  },
];

function AccordionItem({ q, a, open, onToggle }) {
  return (
    <div className="border-b border-cream-dark py-3">
      <button
        type="button"
        onClick={onToggle}
        className="flex min-h-11 w-full items-center justify-between gap-3 text-left text-sm font-medium text-navy"
        aria-expanded={open}
      >
        {q}
        <ChevronDown size={16} className={`shrink-0 text-navy/50 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="mt-2 text-sm text-navy/70">{a}</p>}
    </div>
  );
}

export default function FAQPage() {
  const [openKey, setOpenKey] = useState("0-0");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Help & FAQ</h1>
        <p className="mt-1 text-sm text-navy-light">
          Answers to common questions about buying and selling on Aaganbazaar.
        </p>
      </div>

      {SECTIONS.map((section, si) => (
        <div key={section.title}>
          <h2 className="mb-1 font-medium text-navy">{section.title}</h2>
          <div>
            {section.items.map((item, ii) => {
              const key = `${si}-${ii}`;
              return (
                <AccordionItem
                  key={key}
                  q={item.q}
                  a={item.a}
                  open={openKey === key}
                  onToggle={() => setOpenKey(openKey === key ? null : key)}
                />
              );
            })}
          </div>
        </div>
      ))}

      <p className="text-sm text-navy/70">
        Still need help?{" "}
        <Link to="/contact" className="text-orange hover:underline">
          Contact us
        </Link>
        .
      </p>
    </div>
  );
}
