/** Frosted card that narrates one stop of a scroll chapter. */
export default function ChapterCard({ cardRef, headingId, headingLevel = 3, eyebrow, title, body, chips, children }) {
  const HeadingTag = headingLevel === 2 ? "h2" : "h3";
  return (
    <article
      ref={cardRef}
      className="chapter-card pointer-events-none absolute inset-x-3 bottom-3 rounded-[28px] p-5 text-left opacity-0 will-change-transform md:inset-x-auto md:bottom-auto md:left-8 md:top-1/2 md:w-[min(25rem,38%)] md:-translate-y-1/2 md:p-7"
    >
      <p className="chapter-eyebrow mb-1.5">{eyebrow}</p>
      <HeadingTag
        id={headingId}
        className="mb-2 mt-0 font-[family-name:var(--heading)] text-[22px] font-medium leading-[1.15] text-[var(--text-heading)] md:text-[28px]"
      >
        {title}
      </HeadingTag>
      {body ? <p className="text-[15px] leading-relaxed text-[var(--text-muted)] md:text-base">{body}</p> : null}
      {chips?.length ? (
        <ul className="m-0 mt-3 flex list-none flex-wrap gap-1.5 p-0">
          {chips.map((chip) => (
            <li key={chip} className="chapter-chip">
              {chip}
            </li>
          ))}
        </ul>
      ) : null}
      {children}
    </article>
  );
}
