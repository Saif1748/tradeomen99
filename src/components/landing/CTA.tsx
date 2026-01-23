import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Rocket } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

export function CTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 lg:py-36">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden"
        >
          <div className="glass-card p-12 lg:p-20 text-center relative">
            {/* Background effects */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-glow-secondary/10" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/30 rounded-full blur-[150px] -translate-y-1/2" />
            
            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={isInView ? { scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-glow-secondary mb-8 shadow-lg shadow-primary/25"
              >
                <Rocket size={32} weight="fill" className="text-white" />
              </motion.div>
              
              <h2 className="text-3xl lg:text-5xl font-light tracking-tight-premium leading-section mb-6">
                Ready to Transform Your{" "}
                <span className="text-gradient-primary font-medium">Trading?</span>
              </h2>
              
              <p className="text-lg text-muted-foreground font-light max-w-2xl mx-auto mb-10">
                Join 10,000+ traders who have improved their performance with TradeOmen. 
                Start your free trial today—no credit card required.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link 
                  to="/dashboard"
                  className="glow-button px-10 py-4 rounded-full text-base font-medium text-primary-foreground inline-flex items-center gap-2 group"
                >
                  Start Free Trial
                  <ArrowRight
                    size={18}
                    weight="bold"
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
                <a 
                  href="#demo"
                  className="px-10 py-4 rounded-full text-base font-medium text-foreground border border-border hover:bg-secondary transition-colors"
                >
                  View Demo
                </a>
              </div>
              
              <p className="mt-8 text-sm text-muted-foreground">
                ✓ No credit card required &nbsp;•&nbsp; ✓ 14-day free trial &nbsp;•&nbsp; ✓ Cancel anytime
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
