import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { UserPlus, PencilSimple, ChartLineUp, Trophy } from "@phosphor-icons/react";

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Create Your Account",
    description: "Sign up in seconds. No credit card required. Start with our free tier and upgrade anytime.",
  },
  {
    number: "02",
    icon: PencilSimple,
    title: "Log Your Trades",
    description: "Manually log trades or auto-import from your broker. Add notes, tags, and screenshots.",
  },
  {
    number: "03",
    icon: ChartLineUp,
    title: "Analyze Performance",
    description: "Review your metrics, discover patterns, and get AI-powered insights to improve.",
  },
  {
    number: "04",
    icon: Trophy,
    title: "Trade Smarter",
    description: "Apply learnings, track progress, and watch your performance improve over time.",
  },
];

export function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="how-it-works" ref={ref} className="py-24 lg:py-36">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16 lg:mb-24"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            Simple Process
          </span>
          <h2 className="text-3xl lg:text-5xl font-light tracking-tight-premium leading-section">
            Get Started in <span className="text-gradient-primary font-medium">Minutes</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground font-light max-w-2xl mx-auto">
            Four simple steps to transform your trading journey
          </p>
        </motion.div>

        <div className="relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2" />
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                <div className="glass-card p-8 h-full text-center group hover:scale-[1.02] transition-all duration-300 relative">
                  {/* Step number */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center shadow-lg shadow-primary/25">
                    {index + 1}
                  </div>
                  
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-glow-secondary/20 flex items-center justify-center mb-6 mt-4 group-hover:scale-110 transition-transform">
                    <step.icon size={32} weight="light" className="text-primary" />
                  </div>
                  
                  <h3 className="text-lg font-medium mb-3 tracking-tight-premium">
                    {step.title}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground font-light leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
