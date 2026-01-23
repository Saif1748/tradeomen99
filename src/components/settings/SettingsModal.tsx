import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useSettings, UserProfile, TradingPreferences, AppearanceSettings } from "@/contexts/SettingsContext";
import { toast } from "sonner";
import {
  User,
  PaintBrush,
  ChartLine,
  Robot,
  Bell,
  ShieldCheck,
  Plugs,
  CreditCard,
  Sun,
  Moon,
  Desktop,
  Check,
  Lightning,
  X,
} from "@phosphor-icons/react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsSection = 
  | "profile" 
  | "appearance" 
  | "trading" 
  | "ai" 
  | "notifications" 
  | "privacy" 
  | "integrations" 
  | "subscription";

const sections: { id: SettingsSection; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "appearance", label: "Appearance", icon: PaintBrush },
  { id: "trading", label: "Trading Preferences", icon: ChartLine },
  { id: "ai", label: "AI Assistant", icon: Robot },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Data & Privacy", icon: ShieldCheck },
  { id: "integrations", label: "Integrations", icon: Plugs },
  { id: "subscription", label: "Subscription", icon: CreditCard },
];

const ProfileSection = () => {
  const { profile, setProfile } = useSettings();
  const [localProfile, setLocalProfile] = useState<UserProfile>(profile);

  useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  const handleSave = () => {
    setProfile(localProfile);
    toast.success("Profile updated successfully");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-glow-primary to-glow-secondary flex items-center justify-center text-primary-foreground text-xl font-medium">
          {localProfile.firstName.charAt(0)}{localProfile.lastName.charAt(0)}
        </div>
        <div className="flex-1">
          <Button variant="outline" size="sm">Change Avatar</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input 
            id="firstName" 
            value={localProfile.firstName}
            onChange={(e) => setLocalProfile({ ...localProfile, firstName: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input 
            id="lastName" 
            value={localProfile.lastName}
            onChange={(e) => setLocalProfile({ ...localProfile, lastName: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input 
          id="email" 
          type="email" 
          value={localProfile.email}
          onChange={(e) => setLocalProfile({ ...localProfile, email: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea 
          id="bio" 
          placeholder="Tell us about yourself..." 
          className="resize-none" 
          rows={3}
          value={localProfile.bio}
          onChange={(e) => setLocalProfile({ ...localProfile, bio: e.target.value })}
        />
      </div>
      <Button onClick={handleSave} className="glow-button text-white">
        Save Changes
      </Button>
    </div>
  );
};

const AppearanceSection = () => {
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

const TradingSection = () => {
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

const AISection = () => (
  <div className="space-y-6">
    <div className="space-y-2">
      <Label htmlFor="aiModel">AI Model</Label>
      <Select defaultValue="balanced">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="fast">Fast (Quick responses)</SelectItem>
          <SelectItem value="balanced">Balanced (Recommended)</SelectItem>
          <SelectItem value="precise">Precise (Detailed analysis)</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div className="flex items-center justify-between">
      <div>
        <Label>Memory</Label>
        <p className="text-xs text-muted-foreground">Remember conversation context</p>
      </div>
      <Switch defaultChecked />
    </div>
    <div className="flex items-center justify-between">
      <div>
        <Label>Proactive Insights</Label>
        <p className="text-xs text-muted-foreground">Get AI suggestions automatically</p>
      </div>
      <Switch defaultChecked />
    </div>
    <div className="flex items-center justify-between">
      <div>
        <Label>Trading Style Learning</Label>
        <p className="text-xs text-muted-foreground">Adapt to your trading patterns</p>
      </div>
      <Switch defaultChecked />
    </div>
    <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
      <div className="flex items-center gap-2 mb-2">
        <Robot weight="fill" className="w-5 h-5 text-primary" />
        <span className="text-sm font-medium">AI Usage This Month</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-foreground">247</span>
        <span className="text-sm text-muted-foreground">/ unlimited queries</span>
      </div>
    </div>
  </div>
);

const NotificationsSection = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <Label>Email Notifications</Label>
        <p className="text-xs text-muted-foreground">Receive updates via email</p>
      </div>
      <Switch defaultChecked />
    </div>
    <div className="flex items-center justify-between">
      <div>
        <Label>Push Notifications</Label>
        <p className="text-xs text-muted-foreground">Browser push notifications</p>
      </div>
      <Switch />
    </div>
    <div className="flex items-center justify-between">
      <div>
        <Label>Daily Summary</Label>
        <p className="text-xs text-muted-foreground">Get a daily trading recap</p>
      </div>
      <Switch defaultChecked />
    </div>
    <div className="flex items-center justify-between">
      <div>
        <Label>Weekly Report</Label>
        <p className="text-xs text-muted-foreground">Weekly performance analysis</p>
      </div>
      <Switch defaultChecked />
    </div>
    <div className="flex items-center justify-between">
      <div>
        <Label>AI Insights Alerts</Label>
        <p className="text-xs text-muted-foreground">Notify when AI finds patterns</p>
      </div>
      <Switch defaultChecked />
    </div>
  </div>
);

const PrivacySection = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <Label>Analytics</Label>
        <p className="text-xs text-muted-foreground">Help improve TradeOmen</p>
      </div>
      <Switch defaultChecked />
    </div>
    <div className="flex items-center justify-between">
      <div>
        <Label>Data Sharing</Label>
        <p className="text-xs text-muted-foreground">Share anonymized data for research</p>
      </div>
      <Switch />
    </div>
    <div className="space-y-3">
      <Label>Export Data</Label>
      <div className="flex gap-2">
        <Button variant="outline" size="sm">Export as CSV</Button>
        <Button variant="outline" size="sm">Export as JSON</Button>
      </div>
    </div>
    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck weight="fill" className="w-5 h-5 text-rose-400" />
        <span className="text-sm font-medium text-rose-400">Danger Zone</span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Permanently delete your account and all data. This action cannot be undone.
      </p>
      <Button variant="destructive" size="sm">Delete Account</Button>
    </div>
  </div>
);

const IntegrationsSection = () => {
  const integrations = [
    { name: "TradingView", status: "connected", icon: "📈" },
    { name: "MetaTrader 4", status: "available", icon: "📊" },
    { name: "Interactive Brokers", status: "available", icon: "🏦" },
    { name: "Discord", status: "connected", icon: "💬" },
    { name: "Telegram", status: "available", icon: "✈️" },
  ];

  return (
    <div className="space-y-4">
      {integrations.map((integration) => (
        <div
          key={integration.name}
          className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/50"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{integration.icon}</span>
            <div>
              <span className="text-sm font-medium text-foreground">{integration.name}</span>
              {integration.status === "connected" && (
                <Badge variant="outline" className="ml-2 text-xs border-emerald-500/50 text-emerald-400">
                  Connected
                </Badge>
              )}
            </div>
          </div>
          <Button
            variant={integration.status === "connected" ? "outline" : "default"}
            size="sm"
          >
            {integration.status === "connected" ? "Disconnect" : "Connect"}
          </Button>
        </div>
      ))}
    </div>
  );
};

const SubscriptionSection = () => (
  <div className="space-y-6">
    <div className="p-4 rounded-xl bg-gradient-to-br from-primary/20 to-glow-secondary/10 border border-primary/30">
      <div className="flex items-center gap-2 mb-3">
        <Lightning weight="fill" className="w-5 h-5 text-primary" />
        <span className="text-lg font-medium text-foreground">Pro Plan</span>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        You're currently on the Pro plan with unlimited access to all features.
      </p>
      <div className="flex items-baseline gap-1 mb-4">
        <span className="text-3xl font-semibold text-foreground">$29</span>
        <span className="text-sm text-muted-foreground">/month</span>
      </div>
      <Button variant="outline" className="w-full">Manage Subscription</Button>
    </div>
    
    <div className="space-y-3">
      <Label>Plan Features</Label>
      <ul className="space-y-2">
        {[
          "Unlimited trades & strategies",
          "Advanced AI analysis",
          "Priority support",
          "Export & integrations",
          "Custom reports",
        ].map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check weight="bold" className="w-4 h-4 text-primary" />
            {feature}
          </li>
        ))}
      </ul>
    </div>

    <div className="space-y-3">
      <Label>Billing History</Label>
      <Button variant="outline" size="sm">View Invoices</Button>
    </div>
  </div>
);

const sectionComponents: Record<SettingsSection, React.FC> = {
  profile: ProfileSection,
  appearance: AppearanceSection,
  trading: TradingSection,
  ai: AISection,
  notifications: NotificationsSection,
  privacy: PrivacySection,
  integrations: IntegrationsSection,
  subscription: SubscriptionSection,
};

const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");
  const isMobile = useIsMobile();
  const ActiveComponent = sectionComponents[activeSection];

  const content = (
    <div className="flex flex-col sm:flex-row h-full sm:h-[70vh] max-h-[85vh]">
      {/* Sidebar Navigation */}
      <div className="sm:w-56 sm:border-r border-border/50 sm:pr-4 pb-4 sm:pb-0 overflow-x-auto sm:overflow-x-visible">
        <div className="flex sm:flex-col gap-1 sm:gap-1 min-w-max sm:min-w-0">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all whitespace-nowrap",
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )}
              >
                <Icon weight={isActive ? "fill" : "regular"} className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{section.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 sm:pl-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="text-lg font-medium text-foreground mb-6">
              {sections.find((s) => s.id === activeSection)?.label}
            </h3>
            <ActiveComponent />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-6">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center justify-between">
              <span>Settings</span>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary/50">
                <X weight="bold" className="w-5 h-5" />
              </button>
            </SheetTitle>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-6">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
