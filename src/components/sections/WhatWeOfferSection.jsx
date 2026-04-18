export default function WhatWeOfferSection() {
  const placeholderOfferings = [
    "Private minpaku-style rooms",
    "Local recommendations",
    "Clear house rules and amenities",
  ];

  return (
    <section
      id="what-we-offer"
      aria-labelledby="what-we-offer-heading"
      className="scroll-mt-20 border-b border-[var(--border)] px-4 py-12 text-left md:px-6 md:py-16"
    >
      <h2
        id="what-we-offer-heading"
        className="mb-3 text-2xl font-medium text-[var(--text-heading)] md:text-3xl"
      >
        What we offer
      </h2>
      <p className="mb-6 max-w-2xl text-[var(--text-muted)]">
        Summarize amenities, policies, and anything that sets your stay apart.
      </p>
      <ul className="max-w-xl list-disc space-y-2 pl-5 text-[var(--text)]">
        {placeholderOfferings.map((offeringLine) => (
          <li key={offeringLine}>{offeringLine}</li>
        ))}
      </ul>
    </section>
  );
}
