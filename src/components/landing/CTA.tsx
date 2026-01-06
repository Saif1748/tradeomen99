import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Lightning, CheckCircle } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function CTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 lg:py-32 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden"
        >
          <div className="relative rounded-3xl border border-white/10 bg-card/30 backdrop-blur-md p-12 lg:p-20 text-center overflow-hidden">
            
            {/* Background effects */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -translate-y-1/2 pointer-events-none" />
            
            {/* Texture Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

            <div className="relative z-10">
              {/* Icon Badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={isInView ? { scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/50 mb-8 shadow-lg shadow-primary/25 ring-1 ring-white/10"
              >
                <Lightning size={32} weight="fill" className="text-white" />
              </motion.div>
              
              {/* Headline */}
              <h2 className="text-3xl lg:text-5xl font-light tracking-tight-premium leading-tight mb-6">
                Stop Guessing. <br />
                <span className="font-medium text-gradient-primary">Start Measuring.</span>
              </h2>
              
              {/* Subheadline - No fake user counts, focused on benefit */}
              <p className="text-lg text-muted-foreground font-light max-w-2xl mx-auto mb-10 leading-relaxed">
                Experience the new standard of trading journals. Automate your data, master your psychology, and treat your trading like a business.
              </p>
              
              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/auth?mode=signup">
                  <Button className="glow-button h-12 px-8 rounded-full text-base font-medium text-white min-w-[180px]">
                    Start Free Trial
                    <ArrowRight weight="bold" className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/pricing">
                  <Button 
                    variant="outline" 
                    className="h-12 px-8 rounded-full text-base font-medium border-white/10 hover:bg-white/5 min-w-[180px]"
                  >
                    View Pricing
                  </Button>
                </Link>
              </div>
              
              {/* Trust Badges - Functional Trust */}
              <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground/80">
                <div className="flex items-center gap-2">
                  <CheckCircle weight="fill" className="w-4 h-4 text-emerald-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle weight="fill" className="w-4 h-4 text-emerald-500" />
                  <span>14-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle weight="fill" className="w-4 h-4 text-emerald-500" />
                  <span>Cancel anytime</span>
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}