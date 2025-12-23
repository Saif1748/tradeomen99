import { motion } from "framer-motion";
import { ArrowRight, Lightning } from "@phosphor-icons/react";

const fadeInUp = {
  initial: { opacity: 0, y: 20, filter: "blur(8px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 hero-gradient" />
      <div className="absolute inset-0 mesh-gradient" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.6, delay: 0, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 mb-8"
          >
            <Lightning size={16} weight="fill" className="text-primary" />
            <span className="text-sm font-medium text-primary uppercase tracking-widest">
              Next Generation of Trading
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-4xl sm:text-5xl lg:text-7xl font-medium tracking-tight-premium leading-hero"
          >
            Trade Smarter with{" "}
            <span className="font-semibold text-gradient-primary">
              AI-Powered Insights
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mt-6 text-lg sm:text-xl font-normal text-muted-foreground tracking-normal-premium leading-body max-w-2xl mx-auto"
          >
            TradeOmen combines artificial intelligence with cutting-edge trading
            strategies to help you maximize your investments with precision and ease.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button className="glow-button px-8 py-4 rounded-full text-base font-medium text-primary-foreground inline-flex items-center gap-2 group">
              Get Started
              <ArrowRight 
                size={18} 
                weight="bold" 
                className="transition-transform group-hover:translate-x-1" 
              />
            </button>
            <a 
              href="#how-it-works"
              className="px-8 py-4 rounded-full text-base font-medium text-foreground border border-border hover:bg-secondary/50 transition-colors inline-flex items-center gap-2"
            >
              Learn how it works
            </a>
          </motion.div>
        </div>

        {/* Product Mockup */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.8, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mt-20 lg:mt-24 relative mockup-glow"
        >
          <div className="glass-card p-2 sm:p-4">
            <div className="bg-background/50 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                <span className="ml-4 text-xs text-muted-foreground">TradeOmen Dashboard</span>
              </div>
              <div className="p-6 sm:p-8 space-y-6">
                {/* Dashboard Preview */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Win Rate", value: "68.5%", change: "+4.2%" },
                    { label: "Total Profit", value: "$24,890", change: "+12.5%" },
                    { label: "Trades Today", value: "12", change: "Active" },
                  ].map((stat, i) => (
                    <div key={i} className="glass-card p-4">
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className="text-xl sm:text-2xl font-semibold mt-1">{stat.value}</p>
                      <p className="text-xs text-green-400 mt-1">{stat.change}</p>
                    </div>
                  ))}
                </div>
                {/* Chart Placeholder */}
                <div className="glass-card p-4 h-48 sm:h-64 flex items-end justify-between gap-1">
                  {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-primary/80 to-glow-secondary/60 rounded-t"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
