import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Star, Quotes } from "@phosphor-icons/react";

const testimonials = [
  {
    quote: "TradeOmen completely changed how I approach trading. The AI insights helped me identify patterns I was blind to. My win rate improved by 23% in just 3 months.",
    name: "Marcus Chen",
    role: "Day Trader • 5 years exp.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    profit: "+$12,450/mo",
  },
  {
    quote: "The automatic trade journaling saves me hours every week. I used to dread logging trades, now it's seamless. The strategy comparison feature is incredible.",
    name: "Sarah Williams",
    role: "Swing Trader • 3 years exp.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    profit: "+$8,200/mo",
  },
  {
    quote: "Finally a journal that understands crypto traders. Multi-asset support, 24/7 tracking, and the analytics are top-notch. Best investment in my trading career.",
    name: "David Park",
    role: "Crypto Trader • 2 years exp.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    profit: "+$15,800/mo",
  },
];

export function Testimonials() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="testimonials" ref={ref} className="py-24 lg:py-36 bg-card/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            Success Stories
          </span>
          <h2 className="text-3xl lg:text-5xl font-light tracking-tight-premium leading-section">
            Loved by <span className="text-gradient-primary font-medium">10,000+ Traders</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground font-light max-w-2xl mx-auto">
            See how traders are improving their performance with TradeOmen
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="glass-card p-8 h-full flex flex-col relative group hover:scale-[1.01] transition-transform">
                <Quotes
                  size={32}
                  weight="fill"
                  className="text-primary/20 absolute top-6 right-6"
                />
                
                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} size={16} weight="fill" className="text-yellow-500" />
                  ))}
                </div>
                
                {/* Quote */}
                <p className="text-muted-foreground font-light leading-relaxed flex-1 mb-6">
                  "{testimonial.quote}"
                </p>
                
                {/* Author */}
                <div className="flex items-center gap-4 pt-4 border-t border-border">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-emerald-500">{testimonial.profit}</p>
                    <p className="text-xs text-muted-foreground">avg. profit</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
