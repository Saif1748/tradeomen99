import { motion } from "framer-motion";
import { 
  FileCsv, 
  ArrowRight, 
  Database,
  CheckCircle,
  Cpu,
  Receipt,
  FileText,
  Table,
  ArrowsMerge
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Mock "Raw Data" files
const inputFiles = [
  { name: "binance_futures.csv", icon: FileCsv, color: "text-yellow-400", delay: 0 },
  { name: "metatrader.xlsx", icon: Table, color: "text-green-400", delay: 1.5 },
  { name: "bybit_export.csv", icon: FileText, color: "text-blue-400", delay: 3 },
];

export function SmartImportSection() {
  return (
    <section className="py-24 lg:py-32 relative overflow-hidden bg-background">
      {/* Subtle Divider */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50" />
      
      {/* Background Ambience */}
      <div className="absolute right-0 top-1/4 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* LEFT: The Visual (Data Funnel Animation) */}
          <div className="order-2 lg:order-1 relative h-[450px] flex items-center justify-center">
            
            {/* Central Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-primary/20 blur-[80px] rounded-full -z-10 animate-pulse-slow" />

            {/* 1. INPUT FILES (Floating in) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-sm h-32 flex justify-center">
              {inputFiles.map((file, i) => (
                <motion.div
                  key={i}
                  initial={{ y: -40, opacity: 0, scale: 0.8 }}
                  animate={{ 
                    y: [0, 80, 120], // Move down into the processor
                    opacity: [0, 1, 0], // Fade in then out
                    scale: [0.8, 1, 0.5] // Shrink as it enters
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity, 
                    delay: file.delay, 
                    ease: "easeInOut" 
                  }}
                  className="absolute top-0 flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-card/50 backdrop-blur-md shadow-lg"
                  style={{ x: (i - 1) * 60 }} // Offset horizontally
                >
                  <file.icon weight="duotone" className={cn("w-4 h-4", file.color)} />
                  <span className="text-[10px] font-medium text-foreground/80">{file.name}</span>
                </motion.div>
              ))}
            </div>

            {/* 2. THE PROCESSOR (Center) */}
            <div className="relative z-10 flex flex-col items-center gap-8 mt-8">
              <div className="relative group">
                {/* Outer Ring */}
                <div className="absolute inset-0 rounded-2xl border border-primary/30 rotate-45 scale-110 opacity-50 group-hover:rotate-90 transition-transform duration-[2s]" />
                
                {/* Core */}
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-card to-background border border-primary/20 flex items-center justify-center shadow-2xl shadow-primary/20 z-20">
                  <Cpu weight="duotone" className="w-10 h-10 text-primary animate-pulse" />
                  
                  {/* Processing Particles */}
                  <div className="absolute inset-0 overflow-hidden rounded-2xl">
                     <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-primary/10 to-transparent -translate-y-full animate-scan" />
                  </div>
                </div>

                {/* Connecting Beam */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 h-16 w-0.5 bg-gradient-to-b from-primary/50 to-transparent">
                  <motion.div 
                    className="w-full h-1/2 bg-primary blur-[2px]"
                    animate={{ y: [0, 64] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />
                </div>
              </div>

              {/* 3. OUTPUT (Clean Data) */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                whileInView={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="w-72 bg-card/80 border border-white/10 rounded-xl p-4 shadow-2xl backdrop-blur-xl relative overflow-hidden"
              >
                {/* Success Flash */}
                <motion.div 
                  className="absolute inset-0 bg-emerald-500/10"
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                />

                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-500">
                      <CheckCircle weight="fill" className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-foreground tracking-wide">Import Complete</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">100% Parsed</span>
                </div>
                
                {/* Structured Data Preview */}
                <div className="space-y-2 relative z-10">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-background/50 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-[10px] font-bold">
                        BTC
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">Bitcoin Perp</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                           <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-400">LONG</span>
                           <span className="text-[9px] text-muted-foreground">5x Lev</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-emerald-400">+$420.50</p>
                      <p className="text-[10px] text-muted-foreground">03:42 PM</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 pt-1 opacity-60">
                    <ArrowsMerge className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Merged 3 partial fills</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>


          {/* RIGHT: Text Content */}
          <div className="order-1 lg:order-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] uppercase tracking-widest font-medium mb-6">
                <Database weight="fill" />
                <span>Smart CSV Import</span>
              </div>
              
              <h2 className="text-4xl lg:text-5xl font-light tracking-tight-premium text-foreground mb-6 leading-[1.1]">
                Any Broker. Any Format. <br />
                <span className="font-medium text-gradient-primary">
                  Zero Manual Work.
                </span>
              </h2>
              
              <p className="text-lg text-muted-foreground font-light leading-relaxed mb-8">
                Forget mapping columns or fixing date formats. Simply drag and drop your raw CSV export. 
                Our AI automatically detects the schema, cleans the data, and populates your journal instantly.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
              {[
                "Auto-Column Mapping",
                "Intelligent Deduplication",
                "Split-Order Merging",
                "Fees & Commmission Sync",
                "Timezone Normalization",
                "Multi-Currency Support"
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + (i * 0.05) }}
                  className="flex items-center gap-2.5 group"
                >
                  <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <CheckCircle weight="fill" className="w-2.5 h-2.5 text-primary" />
                  </div>
                  <span className="text-sm text-foreground/80 font-light group-hover:text-foreground transition-colors">{item}</span>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="pt-10 flex flex-wrap gap-4"
            >
              <Button className="glow-button h-12 px-8 rounded-full text-white text-base font-medium">
                Try Uploading a File <ArrowRight weight="bold" className="ml-2 w-4 h-4" />
              </Button>
              <Button variant="outline" className="h-12 px-6 rounded-full border-white/10 hover:bg-white/5 text-muted-foreground hover:text-foreground text-sm font-medium">
                <Receipt weight="duotone" className="mr-2 w-4 h-4" />
                Supported Brokers
              </Button>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}