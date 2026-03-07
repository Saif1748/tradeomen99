import { useState } from "react";
import { X, RotateCcw, Maximize2, Sun, Moon, Monitor, Palette } from "lucide-react";
import { useTheme, ThemeMode, ThemePreset, ThemeFont } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";

const presets: { id: ThemePreset; color: string; label: string }[] = [
  { id: "cyan", color: "#68CDF9", label: "Cyan" },
  { id: "blue", color: "#3B82F6", label: "Blue" },
  { id: "purple", color: "#8B5CF6", label: "Purple" },
  { id: "orange", color: "#F97316", label: "Orange" },
  { id: "green", color: "#22C55E", label: "Green" },
  { id: "red", color: "#EF4444", label: "Red" },
];

const fonts: { id: ThemeFont; label: string }[] = [
  { id: "Public Sans", label: "Public Sans" },
  { id: "Inter", label: "Inter" },
  { id: "DM Sans", label: "DM Sans" },
  { id: "Nunito Sans", label: "Nunito Sans" },
];

const modes: { id: ThemeMode; label: string; icon: React.ElementType }[] = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
];

interface ThemePanelProps {
  open: boolean;
  onClose: () => void;
}

const ThemePanel = ({ open, onClose }: ThemePanelProps) => {
  const { mode, setMode, preset, setPreset, font, setFont, fontSize, setFontSize } = useTheme();

  const handleReset = () => {
    setMode("dark");
    setPreset("cyan");
    setFont("Public Sans");
    setFontSize(16);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[60]" onClick={onClose} />
      
      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-[320px] bg-card border-l border-border z-[70] shadow-sidebar overflow-y-auto scrollbar-sidebar">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Themes</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => {}} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <Maximize2 size={16} />
            </button>
            <button onClick={handleReset} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <RotateCcw size={16} />
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-8">
          {/* Mode selector */}
          <div className="flex rounded-xl bg-muted p-1 gap-1">
            {modes.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  mode === m.id
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {m.id === "light" && <Sun size={14} className="text-amber-400" />}
                {m.id === "system" && <Monitor size={14} />}
                {m.id === "dark" && <Moon size={14} />}
                {m.label}
              </button>
            ))}
          </div>

          {/* Presets */}
          <div>
            <span className="inline-block bg-muted text-muted-foreground text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md mb-4">
              Presets
            </span>
            <div className="grid grid-cols-3 gap-3">
              {presets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPreset(p.id)}
                  className={cn(
                    "flex items-center justify-center h-16 rounded-xl border-2 transition-all",
                    preset === p.id
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border hover:border-muted-foreground/30"
                  )}
                >
                  <div className="flex gap-0.5">
                    <div className="w-3 h-8 rounded-sm" style={{ backgroundColor: p.color, opacity: 0.7 }} />
                    <div className="w-3 h-8 rounded-sm" style={{ backgroundColor: p.color }} />
                    <div className="w-3 h-8 rounded-sm" style={{ backgroundColor: p.color, opacity: 0.5 }} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Font */}
          <div>
            <span className="inline-block bg-muted text-muted-foreground text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md mb-4">
              Font
            </span>
            <div className="grid grid-cols-2 gap-3">
              {fonts.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFont(f.id)}
                  className={cn(
                    "flex flex-col items-center justify-center h-20 rounded-xl border-2 transition-all gap-2",
                    font === f.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                  )}
                >
                  <span className="text-lg font-medium text-foreground" style={{ fontFamily: `'${f.id}', sans-serif` }}>
                    Aa
                  </span>
                  <span className="text-xs text-muted-foreground">{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Font Size</span>
              <span className="text-xs font-semibold bg-foreground text-background px-2.5 py-1 rounded-full">
                {fontSize}px
              </span>
            </div>
            <Slider
              value={[fontSize]}
              onValueChange={([v]) => setFontSize(v)}
              min={12}
              max={20}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-muted-foreground">12px</span>
              <span className="text-[10px] text-muted-foreground">20px</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ThemePanel;
