import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Plus, Minus } from "@phosphor-icons/react";

const faqs = [
  {
    question: "What markets and instruments does TradeOmen support?",
    answer: "TradeOmen supports all major markets including stocks, forex, crypto, options, and futures. You can track any tradeable instrument and our system will automatically categorize and analyze your trades.",
  },
  {
    question: "Can I import trades from my broker?",
    answer: "Yes! We support CSV imports from most major brokers. Simply export your trade history and upload it to TradeOmen. We're also working on direct broker integrations that will auto-sync your trades.",
  },
  {
    question: "How does the AI analysis work?",
    answer: "Our AI analyzes your trading patterns, identifies recurring mistakes, and provides personalized recommendations. It looks at factors like time of day, market conditions, strategy performance, and psychological patterns to help you improve.",
  },
  {
    question: "Is my trading data secure?",
    answer: "Absolutely. We use bank-level encryption (AES-256) to protect your data. We never share your information with third parties, and you can export or delete your data at any time.",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes, you can cancel anytime with no questions asked. If you cancel within 14 days, we'll give you a full refund. Your data will be available for export for 30 days after cancellation.",
  },
  {
    question: "Do you offer team or enterprise plans?",
    answer: "Yes! Our Enterprise plan is designed for prop trading firms, hedge funds, and trading teams. It includes collaboration features, API access, and dedicated support. Contact us for custom pricing.",
  },
];

export function FAQ() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" ref={ref} className="py-24 lg:py-36 bg-card/30">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            FAQ
          </span>
          <h2 className="text-3xl lg:text-5xl font-light tracking-tight-premium leading-section">
            Common <span className="text-gradient-primary font-medium">Questions</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground font-light">
            Everything you need to know about TradeOmen
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.08 }}
            >
              <div className="glass-card overflow-hidden">
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left"
                >
                  <span className="font-medium pr-8">{faq.question}</span>
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    {openIndex === index ? (
                      <Minus size={16} weight="bold" className="text-primary" />
                    ) : (
                      <Plus size={16} weight="bold" className="text-muted-foreground" />
                    )}
                  </div>
                </button>
                
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-6 pb-5">
                        <p className="text-muted-foreground font-light leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
