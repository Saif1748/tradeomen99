import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { 
  ChartLine, 
  Robot, 
  Target, 
  Calendar, 
  Export, 
  ShieldCheck,
  TrendUp,
  Tag
} from "@phosphor-icons/react";

const features = [
  {
    icon: ChartLine,
    title: "Advanced Analytics",
    description: "Track 50+ metrics including win rate, profit factor, drawdown, R-multiples, and equity curves.",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: Robot,
    title: "AI Trade Analysis",
    description: "Get personalized insights and pattern recognition powered by machine learning algorithms.",
    gradient: "from-primary to-glow-secondary",
  },
  {
    icon: Target,
    title: "Strategy Management",
    description: "Create, track, and compare multiple trading strategies with detailed performance metrics.",
    gradient: "from-orange-500 to-amber-500",
  },
  {
    icon: Calendar,
    title: "Visual Calendar",
    description: "View your trading activity on an intuitive calendar with daily P&L and trade counts.",
    gradient: "from-blue-500 to-indigo-500",
  },
  {
    icon: Tag,
    title: "Smart Tagging",
    description: "Organize trades with custom tags and discover which setups work best for you.",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: Export,
    title: "Export Reports",
    description: "Generate professional PDF and CSV reports to track your progress over time.",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: TrendUp,
    title: "Performance Tracking",
    description: "Monitor your trading score, consistency, and risk management in real-time.",
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    icon: ShieldCheck,
    title: "Secure & Private",
    description: "Bank-level encryption ensures your trading data stays safe and private.",
    gradient: "from-green-500 to-emerald-500",
  },
];

export function FeaturesShowcase() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="features" ref={ref} className="py-24 lg:py-36 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 section-gradient" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16 lg:mb-24"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            Powerful Features
          </span>
          <h2 className="text-3xl lg:text-5xl font-light tracking-tight-premium leading-section">
            Everything You Need to{" "}
            <span className="text-gradient-primary font-medium">Trade Smarter</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground font-light max-w-2xl mx-auto">
            A complete toolkit designed to help you analyze, improve, and master your trading
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.08 }}
            >
              <div className="glass-card card-glow p-6 h-full group hover:scale-[1.02] transition-all duration-300">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 shadow-lg`}>
                  <feature.icon size={24} weight="light" className="text-white" />
                </div>
                
                <h3 className="text-lg font-medium mb-2 tracking-tight-premium group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                
                <p className="text-sm text-muted-foreground font-light leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
