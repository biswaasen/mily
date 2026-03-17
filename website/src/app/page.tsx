import HeroSection from "@/components/sections/hero-section";
import WatchSection from "@/components/sections/watch-section";
import Footer from "@/components/sections/footer";

export default function HomePage() {
  return (
    <div className="relative antialiased min-h-screen bg-white overflow-x-hidden">
      <style>{`
        html { scroll-behavior: smooth; }
      `}</style>
      <HeroSection />
      <WatchSection />
      <Footer />
    </div>
  );
}
