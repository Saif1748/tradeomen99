import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quotes, Star } from "@phosphor-icons/react";
import { AnimatedSection } from "./AnimatedSection";

const testimonials = [
  {
    quote: "TradeOmen completely transformed my trading. The AI insights helped me identify patterns I was missing. My win rate improved by 23% in just 3 months.",
    name: "Marcus Chen",
    role: "Day Trader",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    rating: 5,
  },
  {
    quote: "The automatic trade journaling saves me hours every week. Now I can focus on what matters - making better trading decisions.",
    name: "Sarah Williams",
    role: "Swing Trader",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    rating: 5,
  },
  {
    quote: "The strategy analysis feature is incredible. It showed me exactly where I was bleeding money and how to fix it.",
    name: "David Park",
    role: "Options Trader",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    rating: 5,
  },
];

export function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section id="testimonials" className="py-28 lg:py-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center mb-20">
          <h2 className="text-3xl lg:text-5xl font-light tracking-tight-premium leading-section">
            Trusted by Thousands of{" "}
            <span className="text-gradient-primary font-medium">Traders</span>
          </h2>
        </AnimatedSection>

        <AnimatedSection delay={0.1} className="max-w-3xl mx-auto">
          <div className="glass-card p-10 lg:p-14 relative">
            <Quotes
              size={48}
              weight="fill"
              className="text-primary/30 absolute top-6 left-6"
            />
            
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="relative z-10"
              >
                <p className="text-lg lg:text-xl font-light text-foreground leading-body mb-10">
                  "{testimonials[activeIndex].quote}"
                </p>
                
                <div className="flex items-center gap-4">
                  <img
                    src={testimonials[activeIndex].avatar}
                    alt={testimonials[activeIndex].name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-normal text-foreground">{testimonials[activeIndex].name}</p>
                    <p className="text-sm text-muted-foreground font-light">{testimonials[activeIndex].role}</p>
                  </div>
                  <div className="ml-auto flex gap-1">
                    {Array.from({ length: testimonials[activeIndex].rating }).map((_, i) => (
                      <Star key={i} size={16} weight="fill" className="text-yellow-500" />
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex justify-center gap-3 mt-10">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === activeIndex
                    ? "w-8 bg-primary"
                    : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
              />
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
