import { motion } from "framer-motion";
import { Lightning, ChartLineUp, ShieldCheck, Brain } from "@phosphor-icons/react";

const features = [
  {
    icon: ChartLineUp,
    title: "Analyze Performance",
    description: "Get insights on your trading patterns and P&L",
  },
  {
    icon: ShieldCheck,
    title: "Risk Assessment",
    description: "Evaluate position sizing and risk management",
  },
  {
    icon: Brain,
    title: "Psychology Feedback",
    description: "Understand emotional patterns in your trades",
  },
];

const EmptyState = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="text-center mb-8"
    >
      {/* Icon */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-glow-primary to-glow-secondary flex items-center justify-center">
            <Lightning weight="fill" className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="absolute -inset-2 bg-gradient-to-br from-glow-primary/30 to-glow-secondary/30 rounded-3xl blur-xl -z-10" />
        </div>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-semibold text-foreground tracking-tight-premium mb-2">
        How can I help you today?
      </h1>
      <p className="text-muted-foreground text-sm max-w-md mx-auto">
        I'm your AI trading assistant. Ask me about your trades, strategies, or market analysis.
      </p>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8 max-w-2xl mx-auto">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="p-4 rounded-xl bg-secondary/30 border border-border/30 text-left hover:bg-secondary/50 transition-colors cursor-pointer"
            >
              <Icon weight="regular" className="w-5 h-5 text-primary mb-2" />
              <p className="text-sm font-medium text-foreground">{feature.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{feature.description}</p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default EmptyState;
