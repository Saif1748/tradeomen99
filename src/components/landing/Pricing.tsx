import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check, X, Sparkle, Lightning, Globe, Brain } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const frequencies = [
  { id: "monthly", label: "Monthly", priceSuffix: "/mo" },
  { id: "yearly", label: "Yearly", priceSuffix: "/mo", discount: "Save 20%" },
];

const tiers = [
  {
    name: "Starter",
    id: "tier-starter",
    href: "/auth?mode=signup",
    price: { monthly: "$0", yearly: "$0" },
    description: "Perfect for logging manual trades and building discipline.",
    features: [
      "50 Trades per month",
      "2 Strategies",
      "Manual Trade Logging",
      "Basic Reports",
      "Screenshot Uploads",
      "Custom Tags",
    ],
    notIncluded: [
      "AI Analyst & Web Search",
      "Deep Market Research",
      "Smart CSV Import",
      "Broker API Integration",
    ],
    cta: "Start for Free",
    highlight: false,
  },
  {
    name: "Pro",
    id: "tier-pro",
    href: "/auth?mode=signup",
    price: { monthly: "$29", yearly: "$24" },
    description: "Automate your journal and get real-time market answers.",
    features: [
      "Unlimited Trades",
      "10 Strategies",
      "Smart CSV Import (All Brokers)",
      "AI Analyst (Web Search Enabled)",
      "Real-time News Summaries",
      "Advanced Psychology Reports",
      "Everything in Starter"
    ],
    notIncluded: [
      "Deep Research Agents",
      "Automated Broker API Sync",
    ],
    cta: "Start 14-Day Trial",
    highlight: true,
  },
  {
    name: "Elite",
    id: "tier-elite",
    href: "/auth?mode=signup",
    price: { monthly: "$49", yearly: "$39" },
    description: "Institutional-grade research and full automation.",
    features: [
      "Unlimited Strategies",
      "Automated Broker API Sync",
      "Deep Research Agents",
      "Stock & Crypto Deep Dives",
      "Full Data Export",
      "1-on-1 Onboarding Call",
      "Everything in Pro"
    ],
    cta: "Get Elite Access",
    highlight: false,
  },
];

export function Pricing() {
  const [frequency, setFrequency] = useState(frequencies[0]);

  return (
    <section id="pricing" className="py-20 lg:py-24 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl lg:text-4xl font-light tracking-tight-premium mb-4">
            Invest in your <span className="font-medium text-gradient-primary">Edge</span>
          </h2>
          <p className="text-base text-muted-foreground font-light mb-8">
            Start treating your trading like a business today.
          </p>

          {/* Compact Toggle */}
          <div className="flex justify-center items-center gap-3">
            <div className="relative p-1 rounded-full bg-card/50 border border-white/10 backdrop-blur-md inline-flex">
              {frequencies.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setFrequency(option)}
                  className={cn(
                    "relative px-5 py-1.5 rounded-full text-xs font-medium transition-all duration-300 z-10",
                    frequency.id === option.id 
                      ? "text-primary-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {frequency.id === option.id && (
                    <motion.div
                      layoutId="activeFrequency"
                      className="absolute inset-0 bg-primary rounded-full shadow-md shadow-primary/20"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10">{option.label}</span>
                </button>
              ))}
            </div>
            {frequency.id === "monthly" && (
              <span className="text-[10px] font-medium text-emerald-400 animate-pulse ml-1 flex items-center gap-1">
                <Lightning weight="fill" /> Save 20%
              </span>
            )}
          </div>
        </div>

        {/* Compact Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-5 max-w-6xl mx-auto items-start">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={cn(
                "relative rounded-2xl p-6 flex flex-col h-full transition-all duration-300 backdrop-blur-md",
                tier.highlight 
                  ? "bg-card/40 border border-primary/50 shadow-xl shadow-primary/5 z-10 scale-100 md:scale-[1.02]" 
                  : "bg-card/20 border border-white/5 hover:bg-card/30 hover:border-white/10"
              )}
            >
              {tier.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-primary to-primary/80 text-white text-[10px] font-bold flex items-center gap-1 shadow-lg tracking-wide uppercase ring-1 ring-white/20">
                  <Sparkle weight="fill" className="text-yellow-200 w-3 h-3" /> Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
                  {tier.name}
                  {tier.name === "Elite" && <Brain weight="duotone" className="text-purple-400 w-4 h-4" />}
                  {tier.name === "Pro" && <Globe weight="duotone" className="text-blue-400 w-4 h-4" />}
                </h3>
                
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl lg:text-4xl font-light tracking-tighter text-foreground">
                    {tier.price[frequency.id as keyof typeof tier.price]}
                  </span>
                  {tier.price.monthly !== "$0" && (
                    <span className="text-sm text-muted-foreground/80 font-light">{frequency.priceSuffix}</span>
                  )}
                </div>
                
                <p className="mt-3 text-xs text-muted-foreground font-light leading-relaxed min-h-[36px]">
                  {tier.description}
                </p>
              </div>

              {/* Features List - Compact */}
              <div className="flex-1 space-y-3 mb-6">
                {tier.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2.5 group">
                    <div className={cn(
                      "mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
                      tier.highlight ? "bg-primary/20 text-primary" : "bg-white/10 text-muted-foreground group-hover:text-foreground"
                    )}>
                      <Check weight="bold" className="w-2.5 h-2.5" />
                    </div>
                    <span className="text-xs text-foreground/90 font-light leading-snug">
                      {feature.includes("Deep Research") || feature.includes("Web Search") ? (
                        <span className="font-medium text-foreground">{feature}</span>
                      ) : (
                        feature
                      )}
                    </span>
                  </div>
                ))}
                
                {tier.notIncluded && tier.notIncluded.map((feature) => (
                  <div key={feature} className="flex items-start gap-2.5 opacity-40 grayscale transition-opacity hover:opacity-60">
                    <div className="mt-0.5 w-4 h-4 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                      <X weight="bold" className="w-2.5 h-2.5 text-muted-foreground" />
                    </div>
                    <span className="text-xs text-muted-foreground font-light leading-snug">{feature}</span>
                  </div>
                ))}
              </div>

              <Link to={tier.href} className="mt-auto">
                <Button 
                  className={cn(
                    "w-full h-10 rounded-lg text-sm font-medium transition-all duration-300",
                    tier.highlight 
                      ? "glow-button text-white shadow-lg shadow-primary/20 hover:shadow-primary/30" 
                      : "bg-white/5 border border-white/10 hover:bg-white/10 text-foreground hover:border-white/20"
                  )}
                >
                  {tier.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}