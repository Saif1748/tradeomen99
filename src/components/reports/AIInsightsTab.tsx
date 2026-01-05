import { Trade } from "@/lib/tradesData";
import { generateAIInsights } from "@/lib/reportsData";
import { Lightbulb, TrendUp, TrendDown, Info, Brain, Strategy, Clock, ChartBar } from "@phosphor-icons/react";
import { motion } from "framer-motion";

interface AIInsightsTabProps {
  trades: Trade[];
}

const AIInsightsTab = ({ trades }: AIInsightsTabProps) => {
  // Generate insights for all categories
  const overviewInsight = generateAIInsights(trades, "overview");
  const tradeInsight = generateAIInsights(trades, "tradeAnalysis");
  const strategyInsight = generateAIInsights(trades, "strategyAnalysis");
  const timeInsight = generateAIInsights(trades, "timeAnalysis");

  const insights = [
    { title: "Performance Overview", icon: ChartBar, data: overviewInsight, delay: 0 },
    { title: "Trade Execution", icon: Brain, data: tradeInsight, delay: 0.1 },
    { title: "Strategy Optimization", icon: Strategy, data: strategyInsight, delay: 0.2 },
    { title: "Timing & Efficiency", icon: Clock, data: timeInsight, delay: 0.3 },
  ];

  const getStatusColor = (type: string) => {
    switch (type) {
      case "positive": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "negative": return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      default: return "bg-primary/10 text-primary border-primary/20";
    }
  };

  const getStatusIcon = (type: string) => {
    switch (type) {
      case "positive": return TrendUp;
      case "negative": return TrendDown;
      default: return Info;
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 rounded-2xl bg-gradient-to-br from-primary/5 via-background to-secondary/30 border-primary/10">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <Brain weight="duotone" className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-medium text-foreground mb-2">AI Trading Intelligence</h2>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">
              Our AI has analyzed your last {trades.length} trades to identify patterns, strengths, and areas for improvement. 
              Review these insights to refine your edge.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {insights.map((item, index) => {
          const StatusIcon = getStatusIcon(item.data.type);
          const MainIcon = item.icon;
          
          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: item.delay }}
              className="glass-card p-5 sm:p-6 rounded-2xl flex flex-col h-full hover:border-primary/30 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary text-foreground">
                    <MainIcon weight="regular" className="w-5 h-5" />
                  </div>
                  <h3 className="font-medium text-foreground">{item.title}</h3>
                </div>
                <div className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${getStatusColor(item.data.type)}`}>
                  <StatusIcon weight="bold" className="w-3.5 h-3.5" />
                  <span className="capitalize">{item.data.type}</span>
                </div>
              </div>
              
              <div className="flex-1">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.data.message}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Lightbulb weight="fill" className="w-3.5 h-3.5 text-yellow-500/70" />
                  <span>Recommendation available</span>
                </div>
                <button className="text-primary hover:text-primary/80 font-medium transition-colors">
                  Take Action →
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default AIInsightsTab;