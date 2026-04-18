import Calculator from "../Calculator";

export default function PricingSection() {
  return (
    <section
      id="calculator"
      aria-labelledby="pricing-heading"
      className="scroll-mt-20 border-b border-[var(--border)] bg-[var(--bg-muted)] px-4 py-10 text-left md:px-6 md:py-14"
    >
      <div className="mx-auto mb-8 max-w-3xl">
        <h2
          id="pricing-heading"
          className="mb-2 text-3xl font-medium tracking-tight text-[var(--text-heading)] md:text-4xl"
        >
          Plan your stay
        </h2>
        <p className="text-[var(--text-muted)]">
          Adjust quantities below to see a rough cost estimate.
        </p>
      </div>
      <div className="mx-auto max-w-4xl">
        <Calculator />
      </div>
    </section>
  );
}
