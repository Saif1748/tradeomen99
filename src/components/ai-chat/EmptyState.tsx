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
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
          <Lightning weight="fill" className="w-8 h-8 text-primary" />
        </div>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-semibold text-foreground tracking-tight mb-2">
        How can I help you today?
      </h1>
      <p className="text-muted-foreground text-[15px] max-w-md mx-auto">
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
              className="bg-card rounded-2xl card-boundary border border-border/50 shadow-sm p-5 hover:border-border transition-colors cursor-pointer text-left"
            >
              <Icon weight="regular" className="w-6 h-6 text-primary mb-3" />
              <p className="text-sm font-semibold text-foreground">{feature.title}</p>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{feature.description}</p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default EmptyState;
