export default function WhoWeAreSection() {
  return (
    <section
      id="who-we-are"
      aria-labelledby="who-we-are-heading"
      className="scroll-mt-20 border-b border-[var(--border)] bg-[var(--bg-muted)] px-4 py-12 text-left md:px-6 md:py-16"
    >
      <h2
        id="who-we-are-heading"
        className="mb-3 text-2xl font-medium text-[var(--text-heading)] md:text-3xl"
      >
        Who we are
      </h2>
      <p className="max-w-2xl text-[var(--text-muted)]">
        Introduce the hosts or team, your story, and what guests can expect.
        Photos and credentials belong here once you have assets.
      </p>
    </section>
  );
}
