import { motion } from "framer-motion";

const EmptyState = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="text-center mb-8"
    >
      {/* Title */}
      <h1 className="text-2xl font-semibold text-foreground tracking-tight-premium mb-2">
        How can I help you today?
      </h1>
      <p className="text-muted-foreground text-sm max-w-md mx-auto">
        I'm your AI trading assistant. Ask me about your trades, strategies, or market analysis.
      </p>
    </motion.div>
  );
};

export default EmptyState;