import { motion } from "framer-motion";
import { 
  FileCsv, 
  ArrowRight, 
  Database,
  CheckCircle,
  Cpu,
  Receipt,
  FileText
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

// Mock "Raw Data" to float in the background
const floatingFiles = [
  { name: "binance_futures.csv", x: -20, y: -40, delay: 0 },
  { name: "metatrader_history.xlsx", x: 30, y: -20, delay: 1.5 },
  { name: "bybit_export.csv", x: -10, y: 50, delay: 0.8 },
  { name: "ibkr_activity.pdf", x: 40, y: 30, delay: 2.2 },
];

export function SmartImportSection() {
  return (
    <section className="py-24 lg:py-32 relative overflow-hidden bg-background">
      {/* Divider */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent opacity-50" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* LEFT: The Visual (Abstract Data Flow) */}
          <div className="order-2 lg:order-1 relative h-[400px] flex items-center justify-center">
            
            {/* 1. Background Glow (Theme Color) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/20 blur-[100px] rounded-full -z-10" />

            {/* 2. Floating "Raw Files" (Chaos) */}
            {floatingFiles.map((file, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: file.x * 2, y: file.y * 2 }}
                whileInView={{ opacity: 1, x: file.x, y: file.y }}
                animate={{ 
                  y: [file.y, file.y - 10, file.y],
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity, 
                  delay: file.delay,
                  ease: "easeInOut" 
                }}
                className="absolute z-0 flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/50 bg-background/50 backdrop-blur-sm text-xs text-muted-foreground"
              >
                <FileCsv className="w-4 h-4 text-muted-foreground" />
                {file.name}
              </motion.div>
            ))}

            {/* 3. The "AI Processor" (Centerpiece) */}
            <div className="relative z-10 flex flex-col items-center gap-6">
              
              {/* The "Brain" Icon with ripple effect */}
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-50" />
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-xl shadow-primary/20">
                  <Cpu weight="duotone" className="w-8 h-8 text-primary-foreground" />
                </div>
                {/* Connecting Lines */}
                <svg className="absolute top-full left-1/2 -translate-x-1/2 h-8 w-px overflow-visible">
                  <motion.line 
                    x1="0" y1="0" x2="0" y2="32" 
                    stroke="currentColor" 
                    className="text-primary/50" 
                    strokeDasharray="4 4"
                    animate={{ strokeDashoffset: [0, -8] }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                </svg>
              </div>

              {/* The "Result" Card (Order) */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 10 }}
                whileInView={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="w-64 bg-card border border-border/50 rounded-xl p-4 shadow-2xl backdrop-blur-md"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle weight="fill" className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-foreground">Import Success</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Just now</span>
                </div>
                
                {/* Simulated Trade Item */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-6 rounded-full bg-primary" />
                      <div>
                        <p className="text-xs font-bold text-foreground">BTC/USD</p>
                        <p className="text-[10px] text-muted-foreground">Long • 5x Lev</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-primary">+$420.50</p>
                      <p className="text-[10px] text-muted-foreground">Closed</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <span className="text-[10px] text-muted-foreground">+ 142 others parsed</span>
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
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-medium mb-6">
                <Database weight="fill" />
                <span>Smart CSV Import</span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight-premium text-foreground mb-6 leading-tight">
                Any Broker. Any Format. <br />
                <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                  Zero Manual Work.
                </span>
              </h2>
              
              <p className="text-lg text-muted-foreground font-light leading-relaxed">
                Forget mapping columns or fixing date formats. Simply drag and drop your raw CSV export. 
                Our AI automatically detects the schema, cleans the data, and populates your journal instantly.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
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
                  className="flex items-center gap-2"
                >
                  {/* Using standard checkmark style */}
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <CheckCircle weight="fill" className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-sm text-foreground/80 font-light">{item}</span>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="pt-8 flex flex-wrap gap-4"
            >
              <Button className="glow-button px-8 h-12 rounded-full text-white">
                Try Uploading a File <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button variant="ghost" className="h-12 px-6 rounded-full text-muted-foreground hover:text-foreground">
                <Receipt className="mr-2 w-4 h-4" />
                Supported Brokers
              </Button>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}