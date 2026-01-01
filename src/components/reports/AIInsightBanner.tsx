import { Lightbulb, TrendUp, TrendDown, Info } from "@phosphor-icons/react";
import { AIInsight } from "@/lib/reportsData";

interface AIInsightBannerProps {
  insight: AIInsight;
}

const AIInsightBanner = ({ insight }: AIInsightBannerProps) => {
  const getIcon = () => {
    switch (insight.type) {
      case "positive":
        return <TrendUp weight="regular" className="w-4 h-4 text-emerald-400" />;
      case "negative":
        return <TrendDown weight="regular" className="w-4 h-4 text-rose-400" />;
      default:
        return <Info weight="regular" className="w-4 h-4 text-primary" />;
    }
  };

  const getBgClass = () => {
    switch (insight.type) {
      case "positive":
        return "bg-emerald-400/5 border-emerald-400/20";
      case "negative":
        return "bg-rose-400/5 border-rose-400/20";
      default:
        return "bg-primary/5 border-primary/20";
    }
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${getBgClass()}`}>
      <div className="flex items-center gap-2 text-primary/80">
        <Lightbulb weight="fill" className="w-4 h-4" />
        <span className="text-xs font-medium uppercase tracking-wide">AI Insight</span>
      </div>
      <div className="h-4 w-px bg-border" />
      <div className="flex items-center gap-2">
        {getIcon()}
        <span className="text-sm text-foreground/90">{insight.message}</span>
      </div>
    </div>
  );
};

export default AIInsightBanner;
