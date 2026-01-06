import { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { SEO } from "@/components/SEO";
import { Link } from "react-router-dom";
import { Check, X, Sparkle, Lightning, Globe, Brain, CreditCard, ArrowsLeftRight, CaretDown, Question } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

const pricingFaqs = [
  {
    question: "How does the 14-day free trial work?",
    answer: "You get full access to the plan you choose (Pro or Elite) for 14 days. You don't need to enter a credit card to start. If you don't upgrade by the end of the trial, your account will automatically downgrade to the free Starter plan."
  },
  {
    question: "Can I switch plans later?",
    answer: "Yes, you can upgrade, downgrade, or cancel your plan at any time from your dashboard. If you upgrade, the prorated difference will be charged immediately. If you downgrade, the credit will be applied to your next billing cycle."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, Mastercard, American Express) and PayPal. For annual Elite plans, we can also support crypto payments upon request."
  },
  {
    question: "What happens to my data if I cancel?",
    answer: "If you cancel a paid subscription, your account will revert to the Starter plan. You will retain access to your historical data, but you may not be able to add new trades if you exceed the Starter limits (50 trades/mo)."
  },
  {
    question: "Do you offer refunds?",
    answer: "We offer a 14-day money-back guarantee on your first payment. If you're not satisfied with TradeOmen within the first two weeks of paying, simply contact support for a full refund."
  },
];

export default function PricingPage() {
  const [frequency, setFrequency] = useState(frequencies[0]);

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
      <SEO 
        title="Pricing - TradeOmen" 
        description="Simple, transparent pricing. Start for free and upgrade as you scale your trading business." 
      />
      <Navbar />
      
      <main className="flex-grow pt-32 pb-20 relative overflow-hidden">
        {/* Background Ambience */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* --- HEADER --- */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight-premium mb-6">
              Invest in your <span className="font-medium text-gradient-primary">Edge</span>
            </h1>
            <p className="text-lg text-muted-foreground font-light mb-10 leading-relaxed">
              One bad trade often costs more than a year of TradeOmen. <br className="hidden sm:block" />
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
                      "relative px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-300 z-10",
                      frequency.id === option.id 
                        ? "text-primary-foreground" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {frequency.id === option.id && (
                      <motion.div
                        layoutId="activeFrequencyPage"
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

          {/* --- PRICING CARDS --- */}
          <div className="grid md:grid-cols-3 gap-5 max-w-6xl mx-auto items-start mb-24">
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

                {/* Features List */}
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

          {/* --- FAQ SECTION (Styled as Separate Cards) --- */}
          <div className="max-w-3xl mx-auto" id="faq">
            <div className="text-center mb-10">
              <h2 className="text-2xl lg:text-3xl font-light tracking-tight mb-2">
                Billing & Subscription FAQ
              </h2>
              <p className="text-sm text-muted-foreground">
                Everything you need to know about payments and cancellations.
              </p>
            </div>
            
            <Accordion type="single" collapsible className="w-full space-y-4">
              {pricingFaqs.map((faq, i) => (
                <AccordionItem 
                  key={i} 
                  value={`item-${i}`} 
                  className="border border-white/5 rounded-2xl bg-card/20 hover:bg-card/30 transition-all duration-300 px-6 overflow-hidden data-[state=open]:border-primary/20 data-[state=open]:bg-card/40"
                >
                  <AccordionTrigger className="text-sm lg:text-base font-medium hover:no-underline hover:text-primary transition-colors py-5 text-left group">
                    <span className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground group-hover:text-primary group-data-[state=open]:bg-primary/10 group-data-[state=open]:text-primary transition-all">
                        <Question size={14} weight="bold" />
                      </span>
                      {faq.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground font-light leading-relaxed pb-6 pl-9 pr-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Bottom Trust */}
          <div className="mt-20 text-center pb-8">
             <p className="text-sm text-muted-foreground mb-4">Need a custom plan for a prop firm?</p>
             <Link to="/contact">
               <Button variant="outline" className="rounded-full border-white/10 hover:bg-white/5 h-9 text-xs px-6">
                 Contact Sales
               </Button>
             </Link>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}