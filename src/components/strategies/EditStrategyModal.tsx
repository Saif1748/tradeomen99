import { useState, useEffect } from "react";
import { X, Plus, Trash } from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { v4 as uuidv4 } from "uuid";

// --- Types ---
import { Strategy, StrategyRuleGroup, TradingStyle } from "@/types/strategy";
import { AssetClass } from "@/types/trade";

const STRATEGY_ICONS = ["📈", "📉", "⚡", "🐢", "🧠", "🎯", "💎", "🤖", "🌊", "🕯️"];

interface EditStrategyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  strategy: Strategy | null;
  onUpdateStrategy: (strategy: Partial<Strategy>) => void;
}

const EditStrategyModal = ({ open, onOpenChange, strategy, onUpdateStrategy }: EditStrategyModalProps) => {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📈");
  const [description, setDescription] = useState("");
  const [style, setStyle] = useState("");
  const [instruments, setInstruments] = useState("");
  const [ruleGroups, setRuleGroups] = useState<StrategyRuleGroup[]>([]);
  const [newRuleInputs, setNewRuleInputs] = useState<{ [key: string]: string }>({});
  const [iconPickerOpen, setIconPickerOpen] = useState(false);

  // --- 1. Populate State (With Safety Check) ---
  useEffect(() => {
    if (strategy) {
      setName(strategy.name);
      setIcon(strategy.emoji || "⚡");
      setDescription(strategy.description || "");
      setStyle(strategy.style || "");
      setInstruments(strategy.assetClasses?.join(", ") || "");

      // 🛡️ CRITICAL FIX: Handle Legacy Data vs New Array Data
      let safeRules: StrategyRuleGroup[] = [];

      if (Array.isArray(strategy.rules)) {
        // ✅ New Format: It's already an array
        safeRules = JSON.parse(JSON.stringify(strategy.rules));
      } else if (strategy.rules && typeof strategy.rules === 'object') {
        // ⚠️ Old Format (Object): Convert to Array on the fly
        // This prevents the "map is not a function" crash
        const legacyRules = strategy.rules as any;
        safeRules = [
          { id: "entry", name: "Entry Conditions", items: legacyRules.entry || [] },
          { id: "exit", name: "Exit Conditions", items: legacyRules.exit || [] }
        ];
      }

      setRuleGroups(safeRules);
    }
  }, [strategy]);

  // --- 2. Rule Handlers ---
  const handleAddRule = (groupId: string) => {
    const ruleText = newRuleInputs[groupId]?.trim();
    if (!ruleText) return;

    setRuleGroups(prev =>
      prev.map(g =>
        g.id === groupId
          ? { ...g, items: [...(g.items || []), ruleText] }
          : g
      )
    );
    setNewRuleInputs(prev => ({ ...prev, [groupId]: "" }));
  };

  const handleRemoveRule = (groupId: string, ruleIndex: number) => {
    setRuleGroups(prev =>
      prev.map(g =>
        g.id === groupId
          ? { ...g, items: g.items.filter((_, i) => i !== ruleIndex) }
          : g
      )
    );
  };

  const handleDeleteGroup = (groupId: string) => {
    setRuleGroups(prev => prev.filter(g => g.id !== groupId));
  };

  const handleAddGroup = () => {
    const newGroup: StrategyRuleGroup = {
      id: uuidv4(),
      name: "New Group",
      items: []
    };
    setRuleGroups(prev => [...prev, newGroup]);
  };

  const handleGroupNameChange = (groupId: string, newName: string) => {
    setRuleGroups(prev =>
      prev.map(g =>
        g.id === groupId ? { ...g, name: newName } : g
      )
    );
  };

  // --- 3. Submit Handler ---
  const handleSubmit = () => {
    if (!name.trim() || !strategy) return;

    const parsedAssets = instruments
      .split(",")
      .map(i => i.trim().toUpperCase())
      .filter(i => ["STOCK", "CRYPTO", "FOREX", "FUTURES"].includes(i)) as AssetClass[];

    const parsedStyle = (style.toUpperCase() || "DAY_TRADE") as TradingStyle;

    const updates: Partial<Strategy> = {
      name: name.trim(),
      emoji: icon,
      description: description.trim(),
      style: parsedStyle,
      assetClasses: parsedAssets.length > 0 ? parsedAssets : ["STOCK"],
      rules: ruleGroups.filter(g => g.items.length > 0 || g.name !== "New Group")
    };

    onUpdateStrategy(updates);
    onOpenChange(false);
  };

  if (!strategy) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] p-0 gap-0 bg-card border-border">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl font-medium text-foreground">Edit Strategy</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-180px)] px-6">
          <div className="space-y-5 pb-6">
            {/* Strategy Name & Icon */}
            <div className="flex gap-3">
              <div className="flex-1">
                <Label className="text-sm text-muted-foreground mb-2 block">Strategy Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-secondary/50 border-border"
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Icon</Label>
                <Popover open={iconPickerOpen} onOpenChange={setIconPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-12 h-10 text-xl p-0">
                      {icon}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2" align="end">
                    <div className="grid grid-cols-6 gap-1">
                      {STRATEGY_ICONS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => {
                            setIcon(emoji);
                            setIconPickerOpen(false);
                          }}
                          className="text-xl p-2 rounded hover:bg-secondary transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Description */}
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-secondary/50 border-border resize-none min-h-[80px]"
              />
            </div>

            {/* Style */}
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">Style</Label>
              <Input
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="bg-secondary/50 border-border"
              />
            </div>

            {/* Instruments */}
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">Instruments</Label>
              <Input
                value={instruments}
                onChange={(e) => setInstruments(e.target.value)}
                className="bg-secondary/50 border-border"
              />
            </div>

            {/* Rules Groups */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-sm font-medium text-foreground">Rules & Checklist</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleAddGroup} className="text-xs gap-1">
                  <Plus weight="bold" className="w-3 h-3" /> Add Group
                </Button>
              </div>

              <div className="space-y-3">
                {/* 🛡️ Ensure ruleGroups is iterated safely */}
                {Array.isArray(ruleGroups) && ruleGroups.map((group) => (
                  <div key={group.id} className="glass-card p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <Input
                        value={group.name}
                        onChange={(e) => handleGroupNameChange(group.id, e.target.value)}
                        className="text-sm font-medium bg-transparent border-none p-0 h-auto"
                      />
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteGroup(group.id)}>
                        <Trash className="w-4 h-4 text-muted-foreground hover:text-rose-400" />
                      </Button>
                    </div>

                    {group.items?.map((rule, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                        <span className="flex-1">{rule}</span>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveRule(group.id, index)}>
                          <X className="w-3 h-3 text-muted-foreground hover:text-rose-400" />
                        </Button>
                      </div>
                    ))}

                    <Input
                      placeholder="Type a rule and hit Enter..."
                      value={newRuleInputs[group.id] || ""}
                      onChange={(e) => setNewRuleInputs(prev => ({ ...prev, [group.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddRule(group.id))}
                      className="text-sm bg-secondary/30 border-border"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 pt-4 border-t border-border">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name.trim()} className="glow-button">
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditStrategyModal;