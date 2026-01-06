import { motion } from "framer-motion";
import { 
  Lightning, 
  ShieldCheck, 
  Globe, 
  Cpu,
  TrendUp
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const stats = [
  {
    label: "Latency",
    value: "< 50ms",
    subtext: "Global execution speed",
    icon: Lightning,
    color: "text-amber-400",
    gradient: "from-amber-400/20 to-transparent"
  },
  {
    label: "Uptime",
    value: "99.99%",
    subtext: "System reliability",
    icon: Cpu,
    color: "text-primary",
    gradient: "from-primary/20 to-transparent"
  },
  {
    label: "Markets",
    value: "50+",
    subtext: "Crypto, Forex, Indices",
    icon: Globe,
    color: "text-emerald-400",
    gradient: "from-emerald-400/20 to-transparent"
  },
  {
    label: "Security",
    value: "AES-256",
    subtext: "Bank-grade encryption",
    icon: ShieldCheck,
    color: "text-blue-400",
    gradient: "from-blue-400/20 to-transparent"
  },
];

export function StatsShowcase() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Decor - Matches Pricing Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex items-center justify-center gap-2 mb-12 opacity-80">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/50" />
          <span className="text-[10px] sm:text-xs font-medium uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            System Status: Operational
          </span>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/50" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="group relative overflow-hidden rounded-2xl bg-card/20 backdrop-blur-md border border-white/5 hover:border-white/10 transition-all duration-300 hover:bg-card/30"
            >
              {/* Top Gradient Line */}
              <div className={cn("absolute top-0 inset-x-0 h-px bg-gradient-to-r opacity-50 group-hover:opacity-100 transition-opacity", stat.gradient)} />
              
              {/* Subtle Color Glow Background */}
              <div className={cn("absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[60px] opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none", stat.color.replace("text-", "bg-"))} />

              <div className="p-6 flex flex-col items-center sm:items-start relative z-10">
                {/* Header: Icon + Label */}
                <div className="flex items-center gap-3 mb-4 w-full">
                  <div className={cn("p-2 rounded-lg bg-white/5 border border-white/5 shadow-inner", stat.color)}>
                    <stat.icon weight="duotone" className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {stat.label}
                  </span>
                </div>

                {/* Value */}
                <div className="text-4xl lg:text-5xl font-light tracking-tighter text-foreground mb-2">
                  {stat.value}
                </div>

                {/* Subtext */}
                <div className="text-sm text-muted-foreground/70 font-light flex items-center gap-1.5">
                  <TrendUp className={cn("w-3.5 h-3.5 opacity-50", stat.color)} />
                  {stat.subtext}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}