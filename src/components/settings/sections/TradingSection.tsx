import { useSettings } from "@/contexts/SettingsContext";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const TradingSection = () => {
  const { tradingPreferences, setTradingPreferences } = useSettings();
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="currency">Default Currency</Label>
        <Select 
          value={tradingPreferences.currency}
          onValueChange={(value: "USD" | "EUR" | "GBP" | "JPY") => {
            setTradingPreferences({ ...tradingPreferences, currency: value });
            toast.success(`Currency set to ${value}`);
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USD">USD ($)</SelectItem>
            <SelectItem value="EUR">EUR (€)</SelectItem>
            <SelectItem value="GBP">GBP (£)</SelectItem>
            <SelectItem value="JPY">JPY (¥)</SelectItem>
          </SelectContent>
        </Select>
      </div>
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
          </SelectContent>
        </Select>
      </div>
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