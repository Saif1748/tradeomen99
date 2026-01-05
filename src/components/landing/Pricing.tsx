import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Check, ArrowRight, Lightning } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Free",
    description: "Perfect for getting started",
    price: "$0",
    period: "forever",
    features: [
      "Up to 50 trades/month",
      "Basic analytics",
      "30-day history",
      "1 strategy",
      "Manual trade entry",
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
      "Unlimited trades",
      "Advanced analytics",
      "Unlimited history",
      "Unlimited strategies",
      "AI-powered insights",
      "Custom tags & filters",
      "Export to PDF/CSV",
      "Priority support",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    description: "For teams & institutions",
    price: "Custom",
    period: "",
    features: [
      "Everything in Pro",
      "Team collaboration",
      "API access",
      "Custom integrations",
      "Dedicated support",
      "SLA guarantee",
      "Custom onboarding",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export function Pricing() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="pricing" ref={ref} className="py-24 lg:py-36">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            Simple Pricing
          </span>
          <h2 className="text-3xl lg:text-5xl font-light tracking-tight-premium leading-section">
            Start Free, <span className="text-gradient-primary font-medium">Upgrade Anytime</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground font-light max-w-2xl mx-auto">
            No hidden fees. Cancel anytime. 14-day money-back guarantee.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div
                className={`glass-card p-8 h-full flex flex-col relative ${
                  plan.popular ? "border-2 border-primary ring-4 ring-primary/10" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-full shadow-lg">
                    <Lightning size={12} weight="fill" />
                    Most Popular
                  </div>
                )}
                
                <div className="mb-6">
                  <h3 className="text-xl font-medium mb-1">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
                
                <div className="mb-8">
                  <span className="text-4xl font-semibold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check size={18} weight="bold" className="text-primary mt-0.5 shrink-0" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Link
                  to="/dashboard"
                  className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 group ${
                    plan.popular
                      ? "glow-button text-primary-foreground"
                      : "border border-border hover:bg-secondary text-foreground"
                  }`}
                >
                  {plan.cta}
                  <ArrowRight
                    size={16}
                    weight="bold"
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
