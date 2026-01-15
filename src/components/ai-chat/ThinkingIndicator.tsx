import { motion } from "framer-motion";
import { Lightning } from "@phosphor-icons/react";

const ThinkingIndicator = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex gap-4 w-full mb-6 justify-start"
    >
      {/* Pulsing Avatar */}
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          opacity: [1, 0.8, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 mt-1"
      >
        <Lightning weight="fill" className="w-4 h-4 text-white" />
      </motion.div>

      {/* Animated Dots Bubble */}
      <div className="flex items-center gap-1 py-3 px-4 rounded-2xl rounded-tl-sm bg-secondary/40 border border-border/50 backdrop-blur-sm self-start">
        <span className="text-xs text-muted-foreground mr-2 font-medium">Thinking</span>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -4, 0],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
            className="w-1.5 h-1.5 rounded-full bg-primary"
          />
        ))}
      </div>
    </motion.div>
  );
};

export default ThinkingIndicator;