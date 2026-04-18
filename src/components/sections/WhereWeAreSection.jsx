export default function WhereWeAreSection() {
  return (
    <section
      id="where-we-are"
      aria-labelledby="where-we-are-heading"
      className="scroll-mt-20 border-b border-[var(--border)] px-4 py-12 text-left md:px-6 md:py-16"
    >
      <h2
        id="where-we-are-heading"
        className="mb-3 text-2xl font-medium text-[var(--text-heading)] md:text-3xl"
      >
        Where we are
      </h2>
      <p className="max-w-2xl text-[var(--text-muted)]">
        Replace this placeholder with your address, service area map embed, or
        neighborhood context. Keep copy factual and easy to scan.
      </p>
    </section>
  );
}
