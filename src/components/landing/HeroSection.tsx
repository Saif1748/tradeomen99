import { motion } from "framer-motion";
import { ArrowRight, Lightning, Play } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

const fadeInUp = {
  initial: { opacity: 0, y: 30, filter: "blur(10px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
};

// Screenshot URLs from your actual app
const dashboardScreenshot = "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/4394d482-3c53-43c7-8635-7ecca837324f/70bff591-e9bd-48fd-ae4f-9e897a0db18a.lovableproject.com-1767607040527.png";

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-44 lg:pb-32 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 hero-gradient" />
      <div className="absolute inset-0 mesh-gradient" />
      
      {/* Floating orbs */}
      <motion.div 
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px]"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-glow-secondary/20 rounded-full blur-[100px]"
        animate={{ 
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.7, delay: 0, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-primary/30 bg-primary/10 mb-8"
          >
            <Lightning size={16} weight="fill" className="text-primary" />
            <span className="text-sm font-medium text-primary tracking-wide">
              AI-Powered Trading Journal
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.7, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-4xl sm:text-5xl lg:text-7xl font-light tracking-tight-premium leading-hero"
          >
            Your Trading Edge{" "}
            <span className="font-medium text-gradient-primary block sm:inline">
              Starts Here
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mt-8 text-lg sm:text-xl font-light text-muted-foreground tracking-normal-premium leading-body max-w-2xl mx-auto"
          >
            TradeOmen helps traders journal, analyze, and improve their performance 
            with AI-powered insights. Track every trade, discover your patterns, 
            and make smarter decisions.
          </motion.p>

          {/* Stats */}
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.7, delay: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mt-10 flex flex-wrap items-center justify-center gap-8 lg:gap-16"
          >
            {[
              { value: "10K+", label: "Active Traders" },
              { value: "2M+", label: "Trades Logged" },
              { value: "68%", label: "Avg. Win Rate Improvement" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl lg:text-3xl font-medium text-gradient-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link 
              to="/dashboard"
              className="glow-button px-8 py-4 rounded-full text-base font-medium text-primary-foreground inline-flex items-center gap-2 group"
            >
              Start Free Trial
              <ArrowRight 
                size={18} 
                weight="bold" 
                className="transition-transform group-hover:translate-x-1" 
              />
            </Link>
            <a 
              href="#demo"
              className="px-8 py-4 rounded-full text-base font-medium text-foreground border border-border hover:bg-secondary/50 transition-colors inline-flex items-center gap-2"
            >
              <Play size={18} weight="fill" className="text-primary" />
              Watch Demo
            </a>
          </motion.div>
        </div>

        {/* Product Screenshot */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.9, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mt-20 lg:mt-28 relative mockup-glow"
        >
          <div className="glass-card p-2 sm:p-3 overflow-hidden">
            <div className="rounded-xl overflow-hidden border border-border/50">
              <img 
                src={dashboardScreenshot}
                alt="TradeOmen Dashboard - AI-powered trading journal"
                className="w-full h-auto"
                loading="eager"
              />
            </div>
          </div>
          
          {/* Floating feature badges */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="absolute -left-4 top-1/4 hidden lg:block"
          >
            <div className="glass-card px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <span className="text-emerald-400 font-semibold">↑</span>
              </div>
              <div>
                <p className="text-sm font-medium">Win Rate</p>
                <p className="text-xs text-muted-foreground">+23% improvement</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="absolute -right-4 top-1/3 hidden lg:block"
          >
            <div className="glass-card px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-semibold">AI</span>
              </div>
              <div>
                <p className="text-sm font-medium">Smart Insights</p>
                <p className="text-xs text-muted-foreground">Powered by AI</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
