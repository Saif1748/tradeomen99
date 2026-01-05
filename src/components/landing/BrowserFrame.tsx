import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BrowserFrameProps {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}

export const BrowserFrame = ({ children, className, interactive = false }: BrowserFrameProps) => {
  return (
    <div 
      className={cn(
        "group relative rounded-xl bg-background/40 backdrop-blur-md", // Base layer
        // SHADOWS:
        // 1. Hard subtle outline
        // 2. Deep ambient shadow for lift
        "shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_20px_40px_-20px_rgba(0,0,0,0.6)]",
        interactive && "transition-all duration-500 ease-out hover:[transform:translateY(-4px)_scale(1.005)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.15),0_30px_60px_-15px_rgba(var(--primary-rgb),0.25)]",
        className
      )}
    >
      {/* --- BORDER EFFECTS --- */}
      
      {/* 1. Gradient Border (Top-Down Light Source) */}
      {/* This creates the 'carved glass' look where the top edge catches light */}
      <div className="absolute inset-0 rounded-xl pointer-events-none border border-transparent [mask-image:linear-gradient(white,white)]">
        <div className="absolute inset-0 rounded-xl border border-white/20 opacity-50" /> {/* Fallback */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/30 via-white/5 to-white/5 p-[1px]" 
             style={{ mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', maskComposite: 'exclude' }} 
        />
      </div>

      {/* 2. Interactive Shimmer (On Hover) */}
      {/* A light beam that travels across the border when you hover */}
      {interactive && (
        <div 
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none overflow-hidden"
          style={{ zIndex: 2 }}
        >
          <div className="absolute -inset-[100%] bg-[conic-gradient(from_0deg,transparent_0_340deg,white_360deg)] animate-[spin_4s_linear_infinite] opacity-20" />
        </div>
      )}

      {/* --- FRAME CONTENT --- */}
      
      <div className="relative rounded-xl overflow-hidden z-10">
        {/* Browser Header */}
        <div className="flex items-center gap-2 px-4 py-3 bg-card/90 border-b border-white/5 z-10 relative">
          <div className="flex gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]/80 border border-[#E0443E]/30" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]/80 border border-[#D89E24]/30" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]/80 border border-[#1AAB29]/30" />
          </div>
          {/* URL Bar */}
          <div className="hidden sm:flex ml-4 flex-1 max-w-md h-6 items-center justify-center rounded-md bg-black/40 border border-white/5 text-[10px] text-muted-foreground/70 font-medium tracking-wide shadow-inner">
            tradeomen.com/dashboard
          </div>
        </div>

        {/* Inner Content */}
        <div className="relative bg-black/90">
          {children}
          
          {/* Inner Reflection (Glass feel) */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none mix-blend-overlay" />
          
          {/* Scanline Texture (Optional - adds tech feel) */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
        </div>
      </div>
    </div>
  );
};