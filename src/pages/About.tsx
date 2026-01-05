import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { MissionSection } from "@/components/MissionSection";
import { CTA } from "@/components/landing/CTA";
import { SEO } from "@/components/SEO";
import { motion } from "framer-motion";
import { ShieldCheck, Lightbulb, Users } from "@phosphor-icons/react";

const values = [
  {
    icon: ShieldCheck,
    title: "Trust & Transparency",
    description: "We believe your data belongs to you. We build secure, private tools that you can rely on without question."
  },
  {
    icon: Lightbulb,
    title: "Continuous Innovation",
    description: "Markets evolve, and so do we. We are constantly pushing the boundaries of AI to find new edges for our users."
  },
  {
    icon: Users,
    title: "Community First",
    description: "We are traders building for traders. Every feature we build is driven by the real needs of our community."
  }
];

const About = () => {
  return (
    <main className="min-h-screen bg-background">
      <SEO 
        title="About Us"
        description="We are on a mission to democratize trading intelligence. Learn why we built TradeOmen and meet the team dedicated to your trading success."
        canonical="https://tradeomen.com/about"
      />
      
      <Navbar />
      
      {/* Hero Section */}
      <div className="pt-32 pb-12 lg:pt-48 lg:pb-24 px-4 text-center relative overflow-hidden">
        {/* Background Blur Effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] -z-10" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-secondary text-muted-foreground text-sm font-medium mb-6 border border-border">
            Our Story
          </span>
          <h1 className="text-4xl lg:text-6xl font-light tracking-tight-premium leading-hero mb-6">
            Empowering Traders with <br />
            <span className="text-gradient-primary font-medium">Data & AI</span>
          </h1>
          <p className="text-lg text-muted-foreground font-light max-w-2xl mx-auto leading-relaxed">
            We are on a mission to replace gut feeling with data-driven confidence, helping traders of all levels achieve consistency.
          </p>
        </motion.div>
      </div>

      {/* Mission Section */}
      <MissionSection />

      {/* Values Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-light tracking-tight-premium mb-4">
              Our Core <span className="text-gradient-primary font-medium">Values</span>
            </h2>
            <p className="text-muted-foreground font-light">The principles that guide every decision we make.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass-card p-8 rounded-2xl border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-6 text-primary">
                  <value.icon size={24} weight="fill" />
                </div>
                <h3 className="text-xl font-medium mb-3">{value.title}</h3>
                <p className="text-muted-foreground font-light leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <CTA />
      <Footer />
    </main>
  );
};

export default About;