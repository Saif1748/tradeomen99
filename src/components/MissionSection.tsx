import { TrendUp } from "@phosphor-icons/react";
import { AnimatedSection } from "./AnimatedSection";

export function MissionSection() {
  return (
    <section className="py-28 lg:py-40 bg-card/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <AnimatedSection>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-glow-secondary mb-10 icon-glow">
            <TrendUp size={32} weight="light" className="text-primary-foreground" />
          </div>
          
          <h2 className="text-3xl lg:text-4xl font-light tracking-tight-premium leading-section mb-8">
            Why We Built <span className="text-gradient-primary font-medium">TradeOmen</span>
          </h2>
          
          <p className="text-lg text-muted-foreground font-light leading-body mb-8">
            After years of trading, we realized the biggest edge isn't found in indicators 
            or strategies—it's in understanding yourself. TradeOmen was built to help traders 
            see their blind spots, recognize their patterns, and make data-driven decisions 
            that lead to consistent profitability.
          </p>
          
          <p className="text-base text-muted-foreground/80 font-light leading-body">
            Our mission is to democratize trading intelligence and help every trader reach their full potential.
          </p>
        </AnimatedSection>
      </div>
    </section>
  );
}
