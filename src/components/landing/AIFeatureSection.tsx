import { motion } from "framer-motion";
import { BrowserFrame } from "./BrowserFrame";
import { 
  Sparkle, 
  Brain, 
  TrendUp, 
  Warning,
  CheckCircle,
  ArrowRight
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

const examplePrompts = [
  {
    icon: Warning,
    text: "Why is my win rate dropping on Mondays?",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
    delay: 0
  },
  {
    icon: TrendUp,
    text: "Analyze my risk management on AAPL trades.",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
    delay: 0.2
  },
  {
    icon: Brain,
    text: "Based on my last 50 trades, what is my edge?",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
    delay: 0.4
  }
];

export function AIFeatureSection() {
  return (
    <section className="py-24 lg:py-32 relative overflow-hidden bg-background">
      {/* Subtle Background Gradient to separate from previous section */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent opacity-50" />
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* Left: Text Content */}
          <div className="order-2 lg:order-1 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium mb-6">
                <Sparkle weight="fill" />
                <span>TradeOmen Intelligence</span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight-premium text-foreground mb-6 leading-tight">
                Your personal quant, <br />
                <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                  available 24/7.
                </span>
              </h2>
              
              <p className="text-lg text-muted-foreground font-light leading-relaxed">
                Stop manually calculating stats in Excel. Just ask TradeOmen. 
                Our AI analyzes your trade history in real-time to find leaks in your strategy, 
                suggest risk adjustments, and keep your psychology in check.
              </p>
            </motion.div>

            {/* Feature List */}
            <div className="space-y-5">
              {[
                "Natural Language Queries (No SQL needed)",
                "Pattern Recognition for bad habits",
                "Instant Risk & Exposure Analysis",
                "Psychological Bias Detection"
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + (i * 0.1), duration: 0.5 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <CheckCircle weight="fill" className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-foreground/80 font-light">{item}</span>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="pt-4"
            >
              <Button className="glow-button text-white px-8 h-12 rounded-full">
                Try AI Analysis <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>
          </div>

          {/* Right: Visual (Browser Frame + Floating Cards) */}
          <div className="order-1 lg:order-2 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, rotateY: 10 }}
              whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{ perspective: "1000px" }}
              className="relative z-10"
            >
              {/* Browser Frame */}
              <BrowserFrame className="shadow-2xl shadow-primary/10 aspect-[4/3] bg-background/50">
                <img 
                  src="/images/ai-chat.webp" 
                  alt="AI Chat Interface"
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent pointer-events-none" />
              </BrowserFrame>

              {/* Floating Prompt Cards - The "Magic" Effect */}
              <div className="absolute -left-4 sm:-left-12 bottom-8 w-full max-w-sm space-y-3 z-20 hidden sm:block">
                {examplePrompts.map((prompt, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20, y: 10 }}
                    whileInView={{ opacity: 1, x: 0, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 + (index * 0.2), duration: 0.5 }}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border backdrop-blur-md shadow-lg ${prompt.bg} ${prompt.border} bg-background/60`}
                  >
                    <div className={`p-2 rounded-lg ${prompt.bg} ring-1 ring-inset ring-black/5`}>
                      <prompt.icon weight="duotone" className={`w-4 h-4 ${prompt.color}`} />
                    </div>
                    <p className="text-sm font-medium text-foreground">{prompt.text}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}