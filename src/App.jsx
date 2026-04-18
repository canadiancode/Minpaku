import Header from "./components/Header";
import HeroSection from "./components/sections/HeroSection";
import WhereWeAreSection from "./components/sections/WhereWeAreSection";
import WhoWeAreSection from "./components/sections/WhoWeAreSection";
import WhatWeOfferSection from "./components/sections/WhatWeOfferSection";
import ContactSection from "./components/sections/ContactSection";
import PricingSection from "./components/sections/PricingSection";
import "./App.css";

function App() {
  return (
    <>
      <Header />
      <main className="w-full text-left">
        <HeroSection />
        <WhereWeAreSection />
        <WhoWeAreSection />
        <WhatWeOfferSection />
        <PricingSection />
        <ContactSection />
      </main>
    </>
  );
}

export default App;
