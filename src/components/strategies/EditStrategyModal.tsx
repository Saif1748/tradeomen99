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
import { Strategy, RuleGroup, strategyIcons } from "@/lib/strategiesData";

interface EditStrategyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  strategy: Strategy | null;
  onUpdateStrategy: (strategy: Strategy) => void;
}

const EditStrategyModal = ({ open, onOpenChange, strategy, onUpdateStrategy }: EditStrategyModalProps) => {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📈");
  const [description, setDescription] = useState("");
  const [style, setStyle] = useState("");
  const [instruments, setInstruments] = useState("");
  const [ruleGroups, setRuleGroups] = useState<RuleGroup[]>([]);
  const [newRuleInputs, setNewRuleInputs] = useState<{ [key: string]: string }>({});
  const [iconPickerOpen, setIconPickerOpen] = useState(false);

  useEffect(() => {
    if (strategy) {
      setName(strategy.name);
      setIcon(strategy.icon);
      setDescription(strategy.description);
      setStyle(strategy.style);
      setInstruments(strategy.instruments.join(", "));
      setRuleGroups(strategy.ruleGroups.map(g => ({ ...g })));
    }
  }, [strategy]);

  const handleAddRule = (groupId: string) => {
    const ruleText = newRuleInputs[groupId]?.trim();
    if (!ruleText) return;

    setRuleGroups(prev =>
      prev.map(g =>
        g.id === groupId
          ? { ...g, rules: [...g.rules, ruleText] }
          : g
      )
    );
    setNewRuleInputs(prev => ({ ...prev, [groupId]: "" }));
  };

  const handleRemoveRule = (groupId: string, ruleIndex: number) => {
    setRuleGroups(prev =>
      prev.map(g =>
        g.id === groupId
          ? { ...g, rules: g.rules.filter((_, i) => i !== ruleIndex) }
          : g
      )
    );
  };

  const handleDeleteGroup = (groupId: string) => {
    setRuleGroups(prev => prev.filter(g => g.id !== groupId));
  };

  const handleAddGroup = () => {
    const newGroup: RuleGroup = {
      id: `custom-${Date.now()}`,
      name: "New Group",
      rules: []
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

  const handleSubmit = () => {
    if (!name.trim() || !strategy) return;

    onUpdateStrategy({
      ...strategy,
      name: name.trim(),
      icon,
      description: description.trim(),
      style: style.trim(),
      instruments: instruments.split(",").map(i => i.trim().toUpperCase()).filter(Boolean),
      ruleGroups: ruleGroups.filter(g => g.rules.length > 0 || g.name !== "New Group")
    });

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
            {/* Name & Icon */}
            <div className="flex gap-3">
              <div className="flex-1">
                <Label className="text-sm text-muted-foreground mb-2 block">Strategy Name *</Label>
                <Input
                  placeholder="e.g. ICT Silver Bullet"
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
                      {strategyIcons.map((emoji) => (
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
                placeholder="Briefly describe the edge..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-secondary/50 border-border resize-none min-h-[80px]"
              />
            </div>

            {/* Style */}
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">Style</Label>
              <Input
                placeholder="e.g. Scalping, Swing"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="bg-secondary/50 border-border"
              />
            </div>

            {/* Instruments */}
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">Instruments (comma separated)</Label>
              <Input
                placeholder="STOCK, CRYPTO, FOREX"
                value={instruments}
                onChange={(e) => setInstruments(e.target.value)}
                className="bg-secondary/50 border-border"
              />
            </div>

            {/* Rules & Checklist */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-sm font-medium text-foreground">Rules & Checklist</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddGroup}
                  className="text-xs gap-1 text-muted-foreground hover:text-foreground"
                >
                  <Plus weight="bold" className="w-3 h-3" />
                  Add Group
                </Button>
              </div>

              <div className="space-y-3">
                {ruleGroups.map((group) => (
                  <div key={group.id} className="glass-card p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <Input
                        value={group.name}
                        onChange={(e) => handleGroupNameChange(group.id, e.target.value)}
                        className="text-sm font-medium bg-transparent border-none p-0 h-auto focus-visible:ring-0 text-foreground"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteGroup(group.id)}
                        className="h-6 w-6 text-muted-foreground hover:text-rose-400"
                      >
                        <Trash weight="regular" className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Existing Rules */}
                    {group.rules.map((rule, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground group">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                        <span className="flex-1">{rule}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveRule(group.id, index)}
                          className="h-5 w-5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-400"
                        >
                          <X weight="bold" className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}

                    {/* New Rule Input */}
                    <Input
                      placeholder="Type a rule and hit Enter..."
                      value={newRuleInputs[group.id] || ""}
                      onChange={(e) => setNewRuleInputs(prev => ({ ...prev, [group.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddRule(group.id);
                        }
                      }}
                      className="text-sm bg-secondary/30 border-border placeholder:text-muted-foreground/50"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 pt-4 border-t border-border">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="glow-button"
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditStrategyModal;
