import { Link, BookOpen, Robot } from "@phosphor-icons/react";
import { AnimatedSection } from "./AnimatedSection";

const steps = [
  {
    number: "01",
    title: "Connect Your Accounts",
    description: "Securely link your brokerage accounts. We support 50+ brokers worldwide with bank-level encryption.",
    icon: Link,
  },
  {
    number: "02",
    title: "Auto-Journal Trades",
    description: "Every trade is automatically logged and categorized. Add notes, emotions, and screenshots with one click.",
    icon: BookOpen,
  },
  {
    number: "03",
    title: "Get AI Insights",
    description: "Our AI analyzes your trading patterns and provides personalized recommendations to improve your performance.",
    icon: Robot,
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-28 lg:py-40 section-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center mb-20">
          <h2 className="text-3xl lg:text-5xl font-light tracking-tight-premium leading-section">
            How It <span className="text-gradient-primary font-medium">Works</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground font-light tracking-normal-premium max-w-2xl mx-auto">
            Get started in minutes and transform your trading journey
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-10">
          {steps.map((step, index) => (
            <AnimatedSection key={step.number} delay={index * 0.1}>
              <div className="glass-card card-glow p-10 relative group h-full">
                <span className="absolute top-8 right-8 text-6xl font-light text-muted/20">
                  {step.number}
                </span>
                
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-glow-secondary flex items-center justify-center mb-8 icon-glow">
                  <step.icon size={28} weight="light" className="text-primary-foreground" />
                </div>
                
                <h3 className="text-xl font-normal mb-4 tracking-tight-premium">
                  {step.title}
                </h3>
                
                <p className="text-muted-foreground font-light leading-body">
                  {step.description}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
