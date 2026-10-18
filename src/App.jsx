import Header from "./components/header/Header.jsx";
import HeroSection from "./components/sections/HeroSection.jsx";
import WhereWeAreSection from "./components/sections/WhereWeAreSection.jsx";
import OurStorySection from "./components/sections/OurStorySection.jsx";
import ActivitiesSection from "./components/sections/ActivitiesSection.jsx";
import PricingSection from "./components/sections/PricingSection.jsx";
import ContactSection from "./components/sections/ContactSection.jsx";
import FooterSection from "./components/sections/FooterSection.jsx";
import { useLocale } from "./i18n/localeContext.js";

/** One page, one camera journey: every section is a chapter. */
function App() {
  const { t } = useLocale();
  return (
    <>
      <a href="#main" className="skip-link">
        {t.nav.skipToContent}
      </a>
      <Header />
      <main id="main" tabIndex={-1} className="w-full text-left outline-none">
        <HeroSection />
        <WhereWeAreSection />
        <OurStorySection />
        <ActivitiesSection />
        <PricingSection />
        <ContactSection />
      </main>
      <FooterSection />
    </>
  );
}

export default App;
