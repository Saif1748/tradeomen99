import { useTheme } from "next-themes";
import { useSettings } from "@/contexts/SettingsContext";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Sun, Moon, Desktop, Check } from "@phosphor-icons/react";

export const AppearanceSection = () => {
  const { theme, setTheme } = useTheme();
  const { appearance, setAppearance } = useSettings();
  
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>Theme</Label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: "light", label: "Light", icon: Sun },
            { id: "dark", label: "Dark", icon: Moon },
            { id: "system", label: "System", icon: Desktop },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                  theme === t.id
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-secondary/30 border-border hover:border-primary/50"
                )}
              >
                <Icon weight={theme === t.id ? "fill" : "regular"} className="w-6 h-6" />
                <span className="text-sm">{t.label}</span>
                {theme === t.id && <Check weight="bold" className="w-4 h-4 text-primary" />}
              </button>
            );
          })}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="fontSize">Font Size</Label>
        <Select 
          value={appearance.fontSize}
          onValueChange={(value: "small" | "medium" | "large") => {
            setAppearance({ ...appearance, fontSize: value });
            toast.success(`Font size set to ${value}`);
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="small">Small</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="large">Large</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <Label>Reduce Animations</Label>
          <p className="text-xs text-muted-foreground">Minimize motion effects</p>
        </div>
        <Switch 
          checked={appearance.reduceAnimations}
          onCheckedChange={(checked) => {
            setAppearance({ ...appearance, reduceAnimations: checked });
            toast.success(checked ? "Animations reduced" : "Animations enabled");
          }}
        />
      </div>
    </div>
  );
};