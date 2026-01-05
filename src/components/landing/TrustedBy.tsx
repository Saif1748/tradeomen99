import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

const trustedBy = [
  "10,000+ Active Traders",
  "2M+ Trades Logged",
  "50+ Countries",
  "4.9★ Rating",
];

export function TrustedBy() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section ref={ref} className="py-12 lg:py-16 border-y border-border bg-card/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-16">
          {trustedBy.map((item, index) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <span className="text-lg lg:text-xl font-medium text-muted-foreground/70">
                {item}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
