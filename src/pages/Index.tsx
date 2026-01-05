import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { TrustedBy } from "@/components/landing/TrustedBy";
import { FeaturesShowcase } from "@/components/landing/FeaturesShowcase";
import { ProductShowcase } from "@/components/landing/ProductShowcase";
import { AIFeatureSection } from "@/components/landing/AIFeatureSection";
import { SmartImportSection } from "@/components/landing/SmartImportSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Testimonials } from "@/components/landing/Testimonials";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";
import { SEO } from "@/components/SEO";

const Index = () => {
  return (
    <main className="min-h-screen bg-background selection:bg-primary/20 selection:text-primary">
      <SEO 
        title="AI-Powered Trading Journal & Analytics"
        description="Master your trading psychology with TradeOmen. The advanced AI trading journal that analyzes your behavior, identifies patterns, and helps you become profitable."
        canonical="https://tradeomen.com/"
      />
      <Navbar />
      <HeroSection />
      <TrustedBy />
      <FeaturesShowcase />
      
      {/* 1. Core Platform Tour */}
      <ProductShowcase />
      
      {/* 2. The Hook (AI Analysis) */}
      <AIFeatureSection />

      {/* 3. The Enabler (Smart CSV Import) */}
      <SmartImportSection />
      
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
};

export default Index;