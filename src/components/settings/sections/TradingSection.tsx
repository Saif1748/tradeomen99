import { useSettings } from "@/contexts/SettingsContext";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Info } from "@phosphor-icons/react";

// ✅ Import Global Currency Hook & Constants
import { useCurrency } from "@/hooks/use-currency";
import { CURRENCIES } from "@/components/dashboard/DashboardHeader";

export const TradingSection = () => {
  const { tradingPreferences, setTradingPreferences } = useSettings();
  
  // ✅ Use Global Currency State
  // This hook handles persistence to the backend automatically via authApi.updateProfile
  const { currency, setCurrency, format, symbol } = useCurrency();

  return (
    <div className="space-y-6">
      
      {/* --- Currency Setting --- */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="currency">Default Currency</Label>
          {/* ✅ Show Exchange Rate */}
          {currency !== "USD" && (
            <span className="text-[10px] text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Info className="w-3 h-3" />
              Live Rate: 1 USD ≈ {format(1)}
            </span>
          )}
        </div>
        
        <Select 
          value={currency} // Binds to global state 
          onValueChange={(value: string) => {
            setCurrency(value); // Triggers API save & global update
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {/* Reuse the consistent list from Dashboard */}
            {CURRENCIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[10px] text-muted-foreground">
          Your preferred currency will be saved and applied across all reports and dashboards automatically.
        </p>
      </div>

      {/* --- Timezone Setting --- */}
      <div className="space-y-2">
        <Label htmlFor="timezone">Timezone</Label>
        <Select 
          value={tradingPreferences.timezone}
          onValueChange={(value) => {
            setTradingPreferences({ ...tradingPreferences, timezone: value });
            toast.success("Timezone updated");
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="est">Eastern Time (ET)</SelectItem>
            <SelectItem value="pst">Pacific Time (PT)</SelectItem>
            <SelectItem value="utc">UTC</SelectItem>
            <SelectItem value="gmt">GMT</SelectItem>
            <SelectItem value="ist">India Standard Time (IST)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* --- Risk Setting --- */}
      <div className="space-y-2">
        <Label htmlFor="riskLevel">Default Risk Level (%)</Label>
        <Input 
          id="riskLevel" 
          type="number" 
          value={tradingPreferences.riskLevel}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            if (!isNaN(value) && value >= 0.5 && value <= 10) {
              setTradingPreferences({ ...tradingPreferences, riskLevel: value });
            }
          }}
          min="0.5" 
          max="10" 
          step="0.5" 
        />
      </div>

      {/* --- Toggles --- */}
      <div className="flex items-center justify-between">
        <div>
          <Label>Show Weekends</Label>
          <p className="text-xs text-muted-foreground">Display weekend days in calendar</p>
        </div>
        <Switch 
          checked={tradingPreferences.showWeekends}
          onCheckedChange={(checked) => {
            setTradingPreferences({ ...tradingPreferences, showWeekends: checked });
            toast.success(checked ? "Weekends visible" : "Weekends hidden");
          }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label>Auto-Calculate Fees</Label>
          <p className="text-xs text-muted-foreground">Include broker fees in P&L calculations</p>
        </div>
        <Switch 
          checked={tradingPreferences.autoCalculateFees}
          onCheckedChange={(checked) => {
            setTradingPreferences({ ...tradingPreferences, autoCalculateFees: checked });
            toast.success(checked ? "Fees auto-calculated" : "Manual fee entry");
          }}
        />
      </div>
    </div>
  );
};