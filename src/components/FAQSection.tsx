import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CaretDown } from "@phosphor-icons/react";
import { AnimatedSection } from "./AnimatedSection";

const faqs = [
  {
    question: "How does TradeOmen connect to my brokerage?",
    answer: "We use secure, read-only API connections to sync your trades automatically. Your login credentials are never stored on our servers, and we use bank-level encryption for all data transfers.",
  },
  {
    question: "Which brokers do you support?",
    answer: "We support over 50 brokers including Interactive Brokers, TD Ameritrade, Robinhood, E*TRADE, Fidelity, Charles Schwab, and many more. We're constantly adding new integrations.",
  },
  {
    question: "How does the AI analysis work?",
    answer: "Our AI analyzes your trading patterns across multiple dimensions including timing, position sizing, market conditions, and emotional factors. It then provides personalized insights and recommendations to help you improve.",
  },
  {
    question: "Can I import my historical trades?",
    answer: "Yes! You can import trades from CSV files or connect your brokerage to automatically sync historical data. Most brokers allow us to fetch up to 2 years of history.",
  },
  {
    question: "Is my trading data private?",
    answer: "Absolutely. Your data is encrypted at rest and in transit. We never share or sell your trading data. You can delete your account and all associated data at any time.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-28 lg:py-40 bg-card/30">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center mb-20">
          <h2 className="text-3xl lg:text-5xl font-light tracking-tight-premium leading-section">
            Frequently Asked <span className="text-gradient-primary font-medium">Questions</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground font-light tracking-normal-premium">
            Everything you need to know about TradeOmen
          </p>
        </AnimatedSection>

        <div className="space-y-5">
          {faqs.map((faq, index) => (
            <AnimatedSection key={index} delay={index * 0.05}>
              <div className="glass-card rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full p-7 flex items-center justify-between text-left"
                >
                  <span className="font-normal pr-4">{faq.question}</span>
                  <CaretDown
                    size={20}
                    weight="bold"
                    className={`text-primary shrink-0 transition-transform duration-300 ${
                      openIndex === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="px-7 pb-7 text-muted-foreground font-light leading-body">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
