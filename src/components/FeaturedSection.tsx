import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

const logos = ["Bloomberg", "TechCrunch", "Forbes", "Yahoo Finance", "CNBC"];

export function FeaturedSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-16 border-y border-border bg-card/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center text-sm font-medium text-muted-foreground uppercase tracking-widest mb-8"
        >
          Featured In
        </motion.p>
        <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-16">
          {logos.map((logo, index) => (
            <motion.span
              key={logo}
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="text-xl lg:text-2xl font-semibold text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-default"
            >
              {logo}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  );
}
