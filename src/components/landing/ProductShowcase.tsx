import { motion, AnimatePresence, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { 
  ChartLine, 
  ListBullets, 
  Target, 
  Strategy, 
  CalendarBlank, 
  Robot,
  ArrowRight
} from "@phosphor-icons/react";
import { BrowserFrame } from "./BrowserFrame";

// Screenshot mapping using your local WebP images
const screenshots = {
  dashboard: "/images/dashboard.webp",
  ai: "/images/ai-chat.webp",
  trades: "/images/trades.webp",
  strategies: "/images/strategies.webp",
  reports: "/images/reports.webp",
  calendar: "/images/calendar.webp",
};

// Data configuration matching your Sidebar order
const tabs = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: ChartLine,
    title: "Real-Time Trading Dashboard",
    description: "Get a complete overview of your trading performance at a glance. Monitor your P&L, win rate, profit factor, and trading score with beautiful visualizations.",
    features: ["Net P&L tracking", "Trading Score radar", "Cumulative equity curve", "Mini calendar heatmap"],
  },
  {
    id: "ai",
    label: "AI Coach",
    icon: Robot,
    title: "Your Personal Trading Coach",
    description: "Ask questions about your data in plain English. Get instant feedback on risk management, psychology, and strategy optimization.",
    features: ["Natural language queries", "Risk analysis", "Psychology feedback", "24/7 availability"],
  },
  {
    id: "trades",
    label: "Journal",
    icon: ListBullets,
    title: "Comprehensive Trade Journal",
    description: "Log and organize every trade with detailed information. Filter by date, symbol, strategy, and tags to find exactly what you're looking for.",
    features: ["Multi-asset support", "Smart tagging system", "R-Multiple tracking", "Advanced filtering"],
  },
  {
    id: "strategies",
    label: "Strategies",
    icon: Strategy,
    title: "Strategy Performance Tracking",
    description: "Create and manage multiple trading strategies. Compare performance metrics side-by-side to identify your most profitable approaches.",
    features: ["Strategy templates", "Win rate tracking", "P&L per strategy", "Performance comparison"],
  },
  {
    id: "reports",
    label: "Analytics",
    icon: Target,
    title: "Deep Performance Analytics",
    description: "Dive deep into your trading data with professional-grade reports. Analyze by time, strategy, and discover patterns in your trading.",
    features: ["Equity curve analysis", "Win/Loss distribution", "Strategy comparison", "AI-powered insights"],
  },
  {
    id: "calendar",
    label: "Calendar",
    icon: CalendarBlank,
    title: "Visual Consistency Tracker",
    description: "See your trading month in a clear heatmap. Spot consistency patterns, review daily notes, and identify your best trading days.",
    features: ["Monthly P&L view", "Daily trade counts", "Streak tracking", "Quick day review"],
  },
];

export function ProductShowcase() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeTab, setActiveTab] = useState("dashboard");
  
  const activeData = tabs.find(t => t.id === activeTab)!;

  return (
    <section id="demo" ref={ref} className="py-24 lg:py-36 bg-gradient-to-b from-background via-secondary/10 to-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-12 lg:mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20">
            Product Tour
          </span>
          <h2 className="text-3xl lg:text-5xl font-light tracking-tight-premium leading-section">
            See <span className="text-gradient-primary font-medium">TradeOmen</span> in Action
          </h2>
          <p className="mt-6 text-lg text-muted-foreground font-light max-w-2xl mx-auto">
            Explore the powerful features that help thousands of traders improve their performance.
          </p>
        </motion.div>

        {/* Tabs Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-3 mb-16"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 border ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 border-primary scale-105"
                  : "bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground hover:border-border/50"
              }`}
            >
              <tab.icon size={18} weight={activeTab === tab.id ? "fill" : "regular"} />
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Content Area */}
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Info Side (Left on Desktop) */}
          <motion.div
            key={activeTab + "-info"}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="lg:col-span-5 lg:order-last space-y-8"
          >
            {/* Active Icon Badge */}
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 text-primary mb-2 border border-primary/20">
              <activeData.icon size={32} weight="duotone" />
            </div>
            
            <h3 className="text-3xl font-light tracking-tight-premium text-foreground leading-tight">
              {activeData.title}
            </h3>
            
            <p className="text-lg text-muted-foreground font-light leading-relaxed">
              {activeData.description}
            </p>
            
            <ul className="space-y-4 pt-4">
              {activeData.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5 border border-emerald-500/20">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-base text-foreground/90 font-light">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="pt-6">
              <button className="text-primary font-medium hover:text-primary/80 transition-colors inline-flex items-center gap-2 group">
                Learn more about {activeData.label} 
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </motion.div>

          {/* Screenshot Side (Right on Desktop) */}
          <motion.div
            key={activeTab + "-image"}
            initial={{ opacity: 0, scale: 0.97, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.8, 0.25, 1] }} // Smooth "spring-like" ease
            className="lg:col-span-7 relative z-10"
          >
            <div className="relative group">
              {/* Glow Effect behind the screenshot */}
              <div className="absolute -inset-4 bg-primary/20 blur-[60px] rounded-[20%] -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              <BrowserFrame 
                interactive 
                className="shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_20px_60px_-20px_rgba(var(--primary-rgb),0.3)] aspect-[16/10] bg-background/40"
              >
                <img
                  src={screenshots[activeTab as keyof typeof screenshots]}
                  alt={activeData.title}
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                />
              </BrowserFrame>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}