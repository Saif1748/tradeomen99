import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";
import { ChartLine, ListBullets, Target, CalendarBlank } from "@phosphor-icons/react";

const screenshots = {
  dashboard: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/4394d482-3c53-43c7-8635-7ecca837324f/70bff591-e9bd-48fd-ae4f-9e897a0db18a.lovableproject.com-1767607040527.png",
  trades: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/e6bee591-cc01-4c1b-9753-ab4d8346524a/70bff591-e9bd-48fd-ae4f-9e897a0db18a.lovableproject.com-1767607040847.png",
  reports: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/3791b7a6-d058-400c-9a97-c335be963486/70bff591-e9bd-48fd-ae4f-9e897a0db18a.lovableproject.com-1767607042900.png",
  strategies: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b90b6cd7-53f5-4dcb-ba7a-5c701ef8663b/70bff591-e9bd-48fd-ae4f-9e897a0db18a.lovableproject.com-1767607043171.png",
};

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
    id: "trades",
    label: "Trade Journal",
    icon: ListBullets,
    title: "Comprehensive Trade Journal",
    description: "Log and organize every trade with detailed information. Filter by date, symbol, strategy, and tags to find exactly what you're looking for.",
    features: ["Multi-asset support", "Smart tagging system", "R-Multiple tracking", "Advanced filtering"],
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
    id: "strategies",
    label: "Strategies",
    icon: CalendarBlank,
    title: "Strategy Performance Tracking",
    description: "Create and manage multiple trading strategies. Compare performance metrics side-by-side to identify your most profitable approaches.",
    features: ["Strategy templates", "Win rate tracking", "P&L per strategy", "Performance comparison"],
  },
];

export function ProductShowcase() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeTab, setActiveTab] = useState("dashboard");
  
  const activeData = tabs.find(t => t.id === activeTab)!;

  return (
    <section id="demo" ref={ref} className="py-24 lg:py-36 bg-card/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-12 lg:mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            Product Tour
          </span>
          <h2 className="text-3xl lg:text-5xl font-light tracking-tight-premium leading-section">
            See <span className="text-gradient-primary font-medium">TradeOmen</span> in Action
          </h2>
          <p className="mt-6 text-lg text-muted-foreground font-light max-w-2xl mx-auto">
            Explore the powerful features that help thousands of traders improve their performance
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <tab.icon size={18} weight={activeTab === tab.id ? "fill" : "regular"} />
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Content */}
        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12 items-center">
          {/* Info */}
          <motion.div
            key={activeTab + "-info"}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="lg:col-span-2 space-y-6"
          >
            <h3 className="text-2xl lg:text-3xl font-light tracking-tight-premium">
              {activeData.title}
            </h3>
            <p className="text-muted-foreground font-light leading-relaxed">
              {activeData.description}
            </p>
            <ul className="space-y-3">
              {activeData.features.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Screenshot */}
          <motion.div
            key={activeTab + "-image"}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-3"
          >
            <div className="glass-card p-2 overflow-hidden mockup-glow">
              <img
                src={screenshots[activeTab as keyof typeof screenshots]}
                alt={activeData.title}
                className="w-full h-auto rounded-lg"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
