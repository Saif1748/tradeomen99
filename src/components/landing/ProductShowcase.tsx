import { motion, AnimatePresence, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { 
  ChartLine, 
  ListBullets, 
  Target, 
  Strategy, 
  CalendarBlank, 
  Robot,
  CheckCircle,
  CaretRight
} from "@phosphor-icons/react";
import { BrowserFrame } from "./BrowserFrame";
import { cn } from "@/lib/utils";

// Screenshot mapping
const screenshots = {
  dashboard: "/images/dashboard.webp",
  ai: "/images/ai-chat.webp",
  trades: "/images/trades.webp",
  strategies: "/images/strategies.webp",
  reports: "/images/reports.webp",
  calendar: "/images/calendar.webp",
};

const tabs = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: ChartLine,
    title: "Real-Time Command Center",
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
    <section id="demo" ref={ref} className="py-24 lg:py-32 relative overflow-hidden bg-background">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] uppercase tracking-widest font-medium mb-6">
            Product Tour
          </span>
          <h2 className="text-3xl lg:text-5xl font-light tracking-tight-premium leading-section mb-6">
            See <span className="text-gradient-primary font-medium">TradeOmen</span> in Action
          </h2>
          <p className="text-lg text-muted-foreground font-light max-w-2xl mx-auto">
            Explore the powerful features that help professional traders maintain their edge.
          </p>
        </motion.div>

        {/* --- NEW TABS DESIGN: Floating Glass Dock --- */}
        <div className="flex justify-center mb-16 lg:mb-24">
          <div className="flex items-center gap-1 p-1.5 rounded-full bg-black/20 border border-white/10 backdrop-blur-xl overflow-x-auto max-w-full no-scrollbar shadow-2xl shadow-black/20">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 outline-none whitespace-nowrap",
                  activeTab === tab.id ? "text-white" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTabPill"
                    className="absolute inset-0 bg-primary rounded-full shadow-lg shadow-primary/25"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <tab.icon size={18} weight={activeTab === tab.id ? "fill" : "regular"} />
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          
          {/* Text Side */}
          <div className="lg:col-span-5 order-2 lg:order-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.4 }}
                className="space-y-8"
              >
                {/* Icon Box */}
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                  <activeData.icon size={28} weight="duotone" className="text-primary" />
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-3xl lg:text-4xl font-light tracking-tight text-foreground">
                    {activeData.title}
                  </h3>
                  <p className="text-lg text-muted-foreground font-light leading-relaxed">
                    {activeData.description}
                  </p>
                </div>
                
                {/* Feature List */}
                <ul className="space-y-4 pt-2">
                  {activeData.features.map((feature, i) => (
                    <motion.li 
                      key={feature}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + (i * 0.1) }}
                      className="flex items-start gap-3 group"
                    >
                      <CheckCircle weight="fill" className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                      <span className="text-foreground/80 font-light group-hover:text-foreground transition-colors">
                        {feature}
                      </span>
                    </motion.li>
                  ))}
                </ul>

                <div className="pt-6">
                  <button className="text-sm font-medium text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-2 group border-b border-primary/20 pb-0.5 hover:border-primary">
                    Learn more about {activeData.label} 
                    <CaretRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Screenshot Side */}
          <div className="lg:col-span-7 order-1 lg:order-2">
            <div className="relative isolate">
              {/* Dynamic Glow Background */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab + "-glow"}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full -z-10"
                />
              </AnimatePresence>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.98 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <BrowserFrame 
                    interactive 
                    className="shadow-2xl shadow-black/50 border-white/10 bg-[#0A0A0A]"
                  >
                    <div className="aspect-[16/10] w-full overflow-hidden bg-background/50 relative">
                       {/* Placeholder icon while loading */}
                       <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20">
                          <activeData.icon size={48} weight="duotone" />
                       </div>
                       
                       <img
                        src={screenshots[activeTab as keyof typeof screenshots]}
                        alt={activeData.title}
                        className="w-full h-full object-contain object-top" 
                        loading="lazy"
                      />
                    </div>
                  </BrowserFrame>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}