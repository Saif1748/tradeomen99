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
import { useUser } from "@/contexts/UserContext"; // ✅ New
import { useSettings } from "@/hooks/useSettings"; // ✅ New
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
  Gear,
  SpinnerGap,
  ShieldWarning,
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
  const { profile } = useUser();
  // We use the useSettings hook to handle profile-level updates like displayName
  const { updateSettings, isUpdating } = useSettings();
  
  const [displayName, setDisplayName] = useState(profile?.displayName || "");

  useEffect(() => {
    if (profile?.displayName) setDisplayName(profile.displayName);
  }, [profile?.displayName]);

  const handleSave = () => {
    // In our new schema, we use 'displayName' as the single source of truth for identity
    updateSettings({ displayName } as any);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-glow-primary to-glow-secondary flex items-center justify-center text-primary-foreground text-xl font-medium overflow-hidden">
          {profile?.photoURL ? (
             <img src={profile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
             <span>{displayName.charAt(0) || "T"}</span>
          )}
        </div>
        <div className="flex-1">
          <Button variant="outline" size="sm" disabled>Change Avatar</Button>
          <p className="text-[10px] text-muted-foreground mt-1">Google/Github avatars sync automatically.</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="displayName">Display Name</Label>
        <Input 
          id="displayName" 
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="How should we call you?"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input 
          id="email" 
          type="email" 
          value={profile?.email || ""}
          disabled 
          className="opacity-70 bg-secondary/20"
        />
      </div>

      <Button onClick={handleSave} disabled={isUpdating} className="glow-button text-white min-w-[120px]">
        {isUpdating ? <SpinnerGap className="animate-spin" /> : "Save Changes"}
      </Button>
    </div>
  );
};

const AppearanceSection = () => {
  const { theme, setTheme } = useTheme();
  const { preferences, updateSettings } = useSettings();
   
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
            const isSelected = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                   setTheme(t.id);
                   updateSettings({ theme: t.id as any });
                }}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all relative overflow-hidden",
                  isSelected
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-secondary/30 border-border hover:border-primary/50"
                )}
              >
                <Icon weight={isSelected ? "fill" : "regular"} className="w-6 h-6" />
                <span className="text-xs font-medium">{t.label}</span>
                {isSelected && <Check weight="bold" className="absolute top-2 right-2 w-3 h-3 text-primary" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/20 border border-border/50">
        <div>
          <Label className="text-sm font-medium">Auto-Calculate Fees</Label>
          <p className="text-[11px] text-muted-foreground">Apply broker commissions to P&L</p>
        </div>
        <Switch 
          checked={preferences.autoCalculateFees}
          onCheckedChange={(checked) => updateSettings({ autoCalculateFees: checked })}
        />
      </div>
    </div>
  );
};

const TradingSection = () => {
  const { profile } = useUser();
  const { preferences, updateSettings } = useSettings();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Account Currency</Label>
        <Select 
          value={profile?.settings.currency}
          onValueChange={(val) => updateSettings({ currency: val } as any)}
        >
          <SelectTrigger className="bg-secondary/30 border-border/50">
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
        <Label>Timezone</Label>
        <Select 
          value={preferences.timezone}
          onValueChange={(val) => updateSettings({ timezone: val })}
        >
          <SelectTrigger className="bg-secondary/30 border-border/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="UTC">UTC (Default)</SelectItem>
            <SelectItem value="America/New_York">New York (EST)</SelectItem>
            <SelectItem value="Europe/London">London (GMT)</SelectItem>
            <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Risk Per Trade (%)</Label>
        <div className="flex items-center gap-4">
          <Input 
            type="number" 
            value={preferences.riskLevel === "low" ? 1 : preferences.riskLevel === "medium" ? 2 : 5}
            disabled
            className="w-20 opacity-50"
          />
          <div className="flex gap-1">
             {(['low', 'medium', 'high'] as const).map((level) => (
               <Button 
                key={level}
                variant={preferences.riskLevel === level ? "default" : "outline"}
                size="sm"
                className="capitalize text-[10px] h-8"
                onClick={() => updateSettings({ riskLevel: level })}
               >
                 {level}
               </Button>
             ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/20 border border-border/50">
        <div>
          <Label className="text-sm font-medium">Show Weekends</Label>
          <p className="text-[11px] text-muted-foreground">Enable Saturday/Sunday in Calendar</p>
        </div>
        <Switch 
          checked={preferences.showWeekends}
          onCheckedChange={(checked) => updateSettings({ showWeekends: checked })}
        />
      </div>
    </div>
  );
};


const SubscriptionSection = () => {
  const { profile } = useUser();
  const plan = profile?.plan;

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/20 to-glow-secondary/10 border border-primary/30 relative overflow-hidden">
        <div className="absolute -right-4 -top-4 opacity-10">
          <Lightning weight="fill" className="w-24 h-24 text-primary" />
        </div>
        
        <div className="relative z-10">
          <Badge className="mb-2 bg-primary/20 text-primary border-primary/30 hover:bg-primary/20">
            {plan?.tier} PLAN
          </Badge>
          <h4 className="text-2xl font-bold text-foreground mb-1">
            {plan?.tier === "FREE" ? "Starter" : plan?.tier} Edition
          </h4>
          <p className="text-xs text-muted-foreground mb-4">
            {plan?.subscriptionStatus === "active" ? "Your subscription is active and renews automatically." : "Explore the power of TradeOmen."}
          </p>
          <Button variant="outline" className="w-full bg-background/50 hover:bg-background border-border/50">
            Manage Billing
          </Button>
        </div>
      </div>
      
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Usage Limits</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-secondary/30 border border-border/50">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">AI Tokens</p>
            <p className="text-lg font-bold">{profile?.usage.monthlyAiTokensUsed.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-xl bg-secondary/30 border border-border/50">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total Trades</p>
            <p className="text-lg font-bold">{profile?.usage.totalTradesCount.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};


const sectionComponents: Record<SettingsSection, React.FC> = {
  profile: ProfileSection,
  appearance: AppearanceSection,
  trading: TradingSection,
  ai: () => <div className="text-muted-foreground text-sm italic">AI Configuration loading...</div>,
  notifications: () => <div className="text-muted-foreground text-sm italic">Notification settings loading...</div>,
  privacy: () => <div className="text-muted-foreground text-sm italic">Privacy controls loading...</div>,
  integrations: () => <div className="text-muted-foreground text-sm italic">Broker integrations loading...</div>,
  subscription: SubscriptionSection,
};

const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");
  const isMobile = useIsMobile();
  const ActiveComponent = sectionComponents[activeSection];

  const sidebar = (
    <div className="flex sm:flex-col gap-1 min-w-max sm:min-w-0 px-1">
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
            <span className="text-sm font-medium">{section.label}</span>
          </button>
        );
      })}
    </div>
  );

  const content = (
    <div className="flex flex-col sm:flex-row h-full sm:h-[65vh] max-h-[80vh]">
      <div className="sm:w-56 sm:border-r border-border/50 sm:pr-4 pb-4 sm:pb-0 overflow-x-auto sm:overflow-x-visible custom-scrollbar">
        {sidebar}
      </div>

      <div className="flex-1 sm:pl-6 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
          >
            <ActiveComponent />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-6 bg-card">
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center justify-between">
              <span className="text-xl font-bold">Settings</span>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                <X weight="bold" className="w-5 h-5" />
              </Button>
            </SheetTitle>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-8 bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl rounded-3xl gap-8">
        <DialogHeader className="pb-4 border-b border-border/50">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Gear weight="fill" className="text-primary w-6 h-6" />
            Workspace Settings
          </DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;