import japanToCanadaFarUrl from "../../assets/japan-to-canada-far.svg?url";

const heroRouteMaskStyles = {
  backgroundColor: "var(--color-brand)",
  WebkitMaskImage: `url(${japanToCanadaFarUrl})`,
  WebkitMaskRepeat: "no-repeat",
  WebkitMaskPosition: "center",
  WebkitMaskSize: "contain",
  maskImage: `url(${japanToCanadaFarUrl})`,
  maskRepeat: "no-repeat",
  maskPosition: "center",
  maskSize: "contain",
};

export default function HeroSection() {
  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="relative overflow-hidden scroll-mt-20 border-b border-[var(--border)] bg-[var(--bg-muted)] px-4 py-10 text-center md:px-6 md:py-14 md:text-left"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 lg:inset-y-0 lg:left-1/2 lg:right-0"
        style={heroRouteMaskStyles}
      />
      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col md:mx-0 md:max-w-2xl md:items-start">
        <h1
          id="hero-heading"
          className="mb-3 mt-0 text-2xl font-medium leading-[118%] tracking-[-0.24px] text-[var(--text-heading)] text-balance md:text-3xl"
        >
          Canada is easier when someone's waiting for you.
        </h1>
        <p className="max-w-2xl text-[var(--text-muted)]">
          A real Canadian home. Experience Canada the way Canadians do.
        </p>
      </div>
    </section>
  );
}
