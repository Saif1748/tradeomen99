import { ArrowRight } from "@phosphor-icons/react";
import { AnimatedSection } from "./AnimatedSection";

export function CTASection() {
  return (
    <section className="py-28 lg:py-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection>
          <div className="glass-card p-14 lg:p-24 rounded-3xl text-center relative overflow-hidden">
            {/* Background Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-glow-secondary/10" />
            
            <div className="relative z-10">
              <h2 className="text-3xl lg:text-5xl font-light tracking-tight-premium leading-section mb-8">
                Ready to Transform Your{" "}
                <span className="text-gradient-primary font-medium">Trading?</span>
              </h2>
              
              <p className="text-lg text-muted-foreground font-light tracking-normal-premium max-w-2xl mx-auto mb-12">
                Join thousands of traders who have already improved their performance with TradeOmen.
              </p>
              
              <button className="glow-button px-10 py-5 rounded-full text-lg font-normal text-primary-foreground inline-flex items-center gap-3 group">
                Start Your Free Trial
                <ArrowRight
                  size={20}
                  weight="bold"
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
