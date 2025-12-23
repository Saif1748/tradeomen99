import { Brain, Lightning, ChartBar, Shield } from "@phosphor-icons/react";
import { AnimatedSection } from "./AnimatedSection";

const features = [
  {
    title: "AI Trade Analysis",
    description: "Machine learning algorithms analyze your trades to identify winning patterns and costly mistakes.",
    icon: Brain,
  },
  {
    title: "Real-time Sync",
    description: "Automatic synchronization with your brokerage accounts. Never miss a trade.",
    icon: Lightning,
  },
  {
    title: "Advanced Analytics",
    description: "Deep dive into your performance with 50+ metrics including win rate, risk/reward, and drawdown analysis.",
    icon: ChartBar,
  },
  {
    title: "Secure & Private",
    description: "Bank-level encryption and read-only access means your trading data stays safe and private.",
    icon: Shield,
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-medium tracking-tight-premium leading-section">
            Powerful <span className="text-gradient-primary">Features</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground tracking-normal-premium max-w-2xl mx-auto">
            Everything you need to analyze, improve, and master your trading
          </p>
        </AnimatedSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <AnimatedSection key={feature.title} delay={index * 0.1}>
              <div className="glass-card card-glow p-6 h-full group hover:scale-[1.02] transition-transform duration-300">
                <div className="w-12 h-12 rounded-xl bg-secondary group-hover:bg-primary/20 transition-colors flex items-center justify-center mb-5">
                  <feature.icon size={24} weight="light" className="text-primary" />
                </div>
                
                <h3 className="text-lg font-medium mb-2 tracking-tight-premium">
                  {feature.title}
                </h3>
                
                <p className="text-sm text-muted-foreground font-normal leading-body">
                  {feature.description}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
