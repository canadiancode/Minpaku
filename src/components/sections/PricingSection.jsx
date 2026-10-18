import { useLocale } from "../../i18n/localeContext.js";
import Calculator from "../Calculator";
import CloudBank from "../chapters/CloudBank.jsx";

export default function PricingSection() {
  const { t } = useLocale();
  return (
    <section id="pricing" aria-labelledby="pricing-heading" className="page-section pricing-section">
      <CloudBank color="#e9f8fc" backColor="#ffffff" />
      <div className="sky-decor" aria-hidden="true">
        <span className="sky-cloud sky-cloud-a" />
        <span className="sky-cloud sky-cloud-b" />
        <span className="sky-cloud sky-cloud-c" />
      </div>
      <div className="section-inner grid items-center gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
        <div>
          <p className="chapter-eyebrow mb-3">{t.pricing.eyebrow}</p>
          <h2 id="pricing-heading" className="section-heading">
            {t.pricing.title}
          </h2>
          <p className="section-lede">{t.pricing.body}</p>
        </div>
        <Calculator />
      </div>
    </section>
  );
}
