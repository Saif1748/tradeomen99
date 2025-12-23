import { Check, ArrowRight } from "@phosphor-icons/react";
import { AnimatedSection } from "./AnimatedSection";

const plans = [
  {
    name: "Free",
    description: "Perfect for getting started",
    price: "$0",
    period: "forever",
    features: [
      "Manual trade entry",
      "Basic analytics",
      "30-day history",
      "1 trading account",
      "Community support",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    description: "For serious traders",
    price: "$29",
    period: "/month",
    features: [
      "Auto-sync with brokers",
      "AI trade analysis",
      "Unlimited history",
      "5 trading accounts",
      "Advanced analytics",
      "Priority support",
      "Custom tags & filters",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    description: "For teams and institutions",
    price: "Custom",
    period: "",
    features: [
      "Everything in Pro",
      "Unlimited accounts",
      "Team collaboration",
      "API access",
      "Custom integrations",
      "Dedicated account manager",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-28 lg:py-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center mb-20">
          <h2 className="text-3xl lg:text-5xl font-light tracking-tight-premium leading-section">
            Simple, Transparent <span className="text-gradient-primary font-medium">Pricing</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground font-light tracking-normal-premium max-w-2xl mx-auto">
            Start free and upgrade as you grow. No hidden fees.
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-10 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <AnimatedSection key={plan.name} delay={index * 0.1}>
              <div
                className={`glass-card p-10 h-full flex flex-col relative ${
                  plan.popular ? "border-2 border-primary" : ""
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-xs font-normal rounded-full">
                    Most Popular
                  </span>
                )}
                
                <div className="mb-8">
                  <h3 className="text-xl font-normal mb-2">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground font-light">{plan.description}</p>
                </div>
                
                <div className="mb-8">
                  <span className="text-4xl font-medium">{plan.price}</span>
                  <span className="text-muted-foreground font-light">{plan.period}</span>
                </div>
                
                <ul className="space-y-4 mb-10 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check size={18} weight="bold" className="text-primary mt-0.5 shrink-0" />
                      <span className="text-sm text-muted-foreground font-light">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button
                  className={`w-full py-3.5 rounded-xl font-normal transition-all flex items-center justify-center gap-2 group ${
                    plan.popular
                      ? "glow-button text-primary-foreground"
                      : "border border-border hover:bg-secondary/50 text-foreground"
                  }`}
                >
                  {plan.cta}
                  <ArrowRight
                    size={16}
                    weight="bold"
                    className="transition-transform group-hover:translate-x-1"
                  />
                </button>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
