import { motion } from "framer-motion";
import { 
  Lightning, 
  TrendUp, 
  ChartBar, 
  Brain
} from "@phosphor-icons/react";

const personas = [
  {
    title: "The Scalper",
    icon: Lightning,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    description: "You live in the 1-minute timeframe. You need instant execution analysis and automated fee tracking to ensure your edge isn't eaten by commissions."
  },
  {
    title: "The Swing Trader",
    icon: TrendUp,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    description: "You hold for days. You need a structured journal to track your thesis, attach multi-timeframe markups, and maintain patience during drawdowns."
  },
  {
    title: "The Systems Trader",
    icon: ChartBar,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    description: "You care about data, not feelings. You need our advanced R-Multiple reporting and Expectancy calculators to optimize your strategy parameters."
  },
  {
    title: "The Psychology Focused",
    icon: Brain,
    color: "text-primary",
    bg: "bg-primary/10",
    description: "You know your biggest enemy is yourself. You need our AI Coach to flag tilt, revenge trading, and emotional bias before they drain your account."
  },
];

export function TradingPersonas() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-light tracking-tight-premium mb-4">
            Built for <span className="font-medium text-gradient-primary">Every Edge</span>
          </h2>
          <p className="text-lg text-muted-foreground font-light max-w-2xl mx-auto">
            TradeOmen adapts to your specific trading style, not the other way around.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {personas.map((persona, index) => (
            <motion.div
              key={persona.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="group p-8 rounded-2xl bg-card/30 border border-white/5 hover:border-white/10 hover:bg-card/50 transition-all duration-300"
            >
              <div className="flex items-start gap-5">
                <div className={`w-12 h-12 rounded-xl ${persona.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                  <persona.icon weight="duotone" className={`w-6 h-6 ${persona.color}`} />
                </div>
                <div>
                  <h3 className="text-xl font-medium text-foreground mb-3">{persona.title}</h3>
                  <p className="text-base text-muted-foreground font-light leading-relaxed">
                    {persona.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}