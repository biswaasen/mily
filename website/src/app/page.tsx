import Navbar from "@/components/sections/navbar";
import HeroSection from "@/components/sections/hero-section";
import TransformSection from "@/components/sections/transform-section";
import FeaturesSection from "@/components/sections/features-section";
import HowItWorks from "@/components/sections/how-it-works";
import WatchSection from "@/components/sections/watch-section";
import TestimonialsSection from "@/components/sections/testimonials-section";
import PricingSection from "@/components/sections/pricing-section";
import FaqSection from "@/components/sections/faq-section";
import CtaSection from "@/components/sections/cta-section";
import Footer from "@/components/sections/footer";

export default function HomePage() {
  return (
    <div className="relative antialiased min-h-screen bg-white overflow-x-hidden">
      <style>{`html { scroll-behavior: smooth; }`}</style>
      <Navbar />
      <HeroSection />
      <TransformSection />
      <FeaturesSection />
      <HowItWorks />
      <WatchSection />
      <TestimonialsSection />
      <PricingSection />
      <FaqSection />
      <CtaSection />
      <Footer />
    </div>
  );
}
