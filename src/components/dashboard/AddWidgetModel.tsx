import { useState } from "react";
import { X, Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { WIDGET_REGISTRY, CATEGORY_META, WidgetCategory, WidgetDefinition } from "./widgetRegistry";

interface AddWidgetModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (widget: WidgetDefinition) => void;
  existingWidgetIds: string[];
}

const CATEGORIES: WidgetCategory[] = ["performance", "risk", "execution", "psychology", "charts", "strategy", "account"];

export default function AddWidgetModal({ open, onClose, onAdd, existingWidgetIds }: AddWidgetModalProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<WidgetCategory | "all">("all");

  if (!open) return null;

  const filtered = WIDGET_REGISTRY.filter((w) => {
    const matchSearch = !search || w.name.toLowerCase().includes(search.toLowerCase()) || w.description.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === "all" || w.category === activeCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-card rounded-2xl card-boundary overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">Add Widget</h2>
            <p className="text-xs text-text-secondary mt-0.5">{WIDGET_REGISTRY.length} widgets available</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-foreground hover:bg-muted transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 pt-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search widgets..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {/* Category tabs */}
        <div className="px-6 pt-3 flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveCategory("all")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
              activeCategory === "all" ? "bg-primary text-primary-foreground" : "bg-secondary text-text-secondary hover:text-foreground"
            )}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-text-secondary hover:text-foreground"
              )}
            >
              {CATEGORY_META[cat].label}
            </button>
          ))}
        </div>

        {/* Widget Grid */}
        <div className="flex-1 overflow-y-auto p-6 pt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filtered.map((widget) => {
              const alreadyAdded = existingWidgetIds.includes(widget.id);
              const Icon = widget.icon;
              return (
                <button
                  key={widget.id}
                  onClick={() => !alreadyAdded && onAdd(widget)}
                  disabled={alreadyAdded}
                  className={cn(
                    "text-left p-4 rounded-xl border transition-all group",
                    alreadyAdded
                      ? "border-border bg-muted/50 opacity-50 cursor-not-allowed"
                      : "border-border bg-card hover:border-primary/40 hover:bg-primary/5 cursor-pointer"
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${CATEGORY_META[widget.category].color}20` }}
                    >
                      <Icon size={16} style={{ color: CATEGORY_META[widget.category].color }} />
                    </div>
                    {!alreadyAdded && (
                      <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus size={14} className="text-primary" />
                      </div>
                    )}
                    {alreadyAdded && (
                      <span className="text-[10px] text-text-secondary bg-muted px-1.5 py-0.5 rounded">Added</span>
                    )}
                  </div>
                  <div className="text-sm font-medium text-foreground">{widget.name}</div>
                  <div className="text-[11px] text-text-secondary mt-0.5 line-clamp-2">{widget.description}</div>
                  <div className="mt-2">
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                      style={{
                        color: CATEGORY_META[widget.category].color,
                        backgroundColor: `${CATEGORY_META[widget.category].color}15`,
                      }}
                    >
                      {CATEGORY_META[widget.category].label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-text-secondary text-sm">No widgets match your search.</div>
          )}
        </div>
      </div>
    </div>
  );
}
