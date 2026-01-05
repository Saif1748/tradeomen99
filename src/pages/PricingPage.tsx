import { Navbar } from "@/components/landing/Navbar";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";
import { SEO } from "@/components/SEO";
import { motion } from "framer-motion";

const PricingPage = () => {
  return (
    <main className="min-h-screen bg-background">
      <SEO 
        title="Pricing Plans"
        description="Simple, transparent pricing for every trader. Start for free and upgrade as you grow. No hidden fees."
        canonical="https://tradeomen.com/pricing"
      />
      
      <Navbar />
      
      {/* Spacer for fixed navbar */}
      <div className="pt-24 lg:pt-32">
        <div className="relative text-center px-4 mb-10">
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.5 }}
           >
             <h1 className="text-4xl lg:text-6xl font-light tracking-tight-premium leading-hero mb-6">
               Simple, Transparent <span className="text-gradient-primary font-medium">Pricing</span>
             </h1>
             <p className="text-lg text-muted-foreground font-light max-w-2xl mx-auto">
               Choose the plan that fits your trading journey. No hidden fees. Cancel anytime.
             </p>
           </motion.div>
        </div>

        {/* Pricing Components */}
        <div className="-mt-12 lg:-mt-24">
            <Pricing />
        </div>
        
        <div className="bg-card/30">
            <FAQ />
        </div>
        
        <CTA />
      </div>

      <Footer />
    </main>
  );
};

export default PricingPage;