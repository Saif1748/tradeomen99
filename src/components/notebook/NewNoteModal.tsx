// src/components/notebook/NewNoteModal.tsx
import { useState, useEffect } from "react";
import {
    X, FileText, Calendar, Briefcase, User,
    TrendingUp, TrendingDown, Search, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAllTradesSimple } from "@/services/tradeService";
import { Timestamp } from "firebase/firestore";
import { format } from "date-fns";

// Minimal trade shape for the picker
interface TradePick {
    id: string;
    symbol: string;
    direction: string;
    entryDate: Timestamp;
    netPnl: number;
    status: string;
}

interface NewNoteModalProps {
    open: boolean;
    onClose: () => void;
    onCreate: (data: {
        title: string;
        category: string;
        content?: string;
        tradeId?: string;
        tradeDate?: string;   // YYYY-MM-DD for Daily Notes
    }) => void;
    customFolders: string[];
    defaultCategory?: string;
    accountId?: string;
}

const BUILT_IN = [
    { label: "Trade Note", icon: Briefcase, color: "text-orange-400" },
    { label: "Daily Note", icon: Calendar, color: "text-blue-400" },
    { label: "Personal Note", icon: User, color: "text-purple-400" },
];

export const NewNoteModal = ({
    open,
    onClose,
    onCreate,
    customFolders,
    defaultCategory = "Personal Note",
    accountId,
}: NewNoteModalProps) => {
    const [step, setStep] = useState<"pick-category" | "trade" | "daily" | "personal">("pick-category");
    const [category, setCategory] = useState(defaultCategory);

    // Trade Note state
    const [trades, setTrades] = useState<TradePick[]>([]);
    const [loadingTrades, setLoadingTrades] = useState(false);
    const [selectedTrade, setSelectedTrade] = useState<TradePick | null>(null);
    const [tradeSearch, setTradeSearch] = useState("");

    // Daily Note state
    const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));

    // Personal / custom state
    const [title, setTitle] = useState("");

    // Reset when modal opens
    useEffect(() => {
        if (!open) return;
        setStep("pick-category");
        setCategory(defaultCategory);
        setSelectedTrade(null);
        setTradeSearch("");
        setTitle("");
        setSelectedDate(format(new Date(), "yyyy-MM-dd"));
    }, [open, defaultCategory]);

    // Load trades list when Trade Note step is shown
    useEffect(() => {
        if (step !== "trade" || !accountId) return;
        setLoadingTrades(true);
        getAllTradesSimple(accountId)
            .then(setTrades)
            .catch(() => setTrades([]))
            .finally(() => setLoadingTrades(false));
    }, [step, accountId]);

    if (!open) return null;

    const filteredTrades = trades.filter((t) =>
        t.symbol.toLowerCase().includes(tradeSearch.toLowerCase())
    );

    const handleCategoryPick = (cat: string) => {
        setCategory(cat);
        if (cat === "Trade Note") setStep("trade");
        else if (cat === "Daily Note") setStep("daily");
        else setStep("personal");
    };

    const handleCreate = () => {
        if (step === "trade") {
            if (!selectedTrade) return;
            onCreate({
                title: `${selectedTrade.symbol} — Trade Note`,
                category,
                tradeId: selectedTrade.id,
            });
        } else if (step === "daily") {
            onCreate({
                title: format(new Date(selectedDate + "T00:00:00"), "EEEE, MMMM d, yyyy"),
                category,
                tradeDate: selectedDate,
            });
        } else {
            onCreate({ title: title.trim() || "Untitled", category });
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div
                className="relative z-10 w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileText size={16} className="text-primary" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-foreground leading-none">New Note</h2>
                            {step !== "pick-category" && (
                                <button
                                    onClick={() => setStep("pick-category")}
                                    className="text-[11px] text-muted-foreground hover:text-primary transition-colors mt-0.5"
                                >
                                    ← Change category
                                </button>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="p-5">

                    {/* ── STEP 1: Pick Category ── */}
                    {step === "pick-category" && (
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                                Choose note type
                            </p>
                            {BUILT_IN.map(({ label, icon: Icon, color }) => (
                                <button
                                    key={label}
                                    type="button"
                                    onClick={() => handleCategoryPick(label)}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent bg-secondary/40 hover:border-border hover:bg-secondary/70 transition-all text-left group"
                                >
                                    <Icon size={18} className={color} />
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-foreground">{label}</p>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                            {label === "Trade Note" && "Link to a specific trade from your journal"}
                                            {label === "Daily Note" && "One note per day — pick the date"}
                                            {label === "Personal Note" && "Free-form note, any topic"}
                                        </p>
                                    </div>
                                    <ChevronDown size={14} className="text-muted-foreground -rotate-90 group-hover:text-foreground transition-colors" />
                                </button>
                            ))}

                            {customFolders.length > 0 && (
                                <>
                                    <div className="border-t border-border my-2" />
                                    {customFolders.map((name) => (
                                        <button
                                            key={name}
                                            type="button"
                                            onClick={() => handleCategoryPick(name)}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border border-transparent bg-secondary/40 hover:border-border hover:bg-secondary/70 transition-all"
                                        >
                                            <FileText size={16} className="text-muted-foreground" />
                                            <span className="text-sm font-medium text-foreground">{name}</span>
                                            <ChevronDown size={14} className="text-muted-foreground -rotate-90 ml-auto" />
                                        </button>
                                    ))}
                                </>
                            )}
                        </div>
                    )}

                    {/* ── STEP 2a: Trade Note — pick a trade ── */}
                    {step === "trade" && (
                        <div className="space-y-3">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Select a trade
                            </p>

                            {/* Search */}
                            <div className="flex items-center gap-2 bg-secondary/50 rounded-xl px-3 py-2 border border-border focus-within:border-primary/50 transition-all">
                                <Search size={13} className="text-muted-foreground shrink-0" />
                                <input
                                    type="text"
                                    placeholder="Search symbol..."
                                    value={tradeSearch}
                                    onChange={(e) => setTradeSearch(e.target.value)}
                                    autoFocus
                                    className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1"
                                />
                            </div>

                            {/* Trade list */}
                            <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                                {loadingTrades ? (
                                    <div className="space-y-2">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="h-12 rounded-xl bg-secondary/30 animate-pulse" />
                                        ))}
                                    </div>
                                ) : filteredTrades.length === 0 ? (
                                    <div className="text-center py-6 text-sm text-muted-foreground">
                                        {tradeSearch ? `No trades matching "${tradeSearch}"` : "No trades found"}
                                    </div>
                                ) : filteredTrades.map((t) => {
                                    const isSelected = selectedTrade?.id === t.id;
                                    const pnlPositive = (t.netPnl ?? 0) >= 0;
                                    return (
                                        <button
                                            key={t.id}
                                            onClick={() => setSelectedTrade(t)}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all",
                                                isSelected
                                                    ? "bg-primary/10 border-primary/30"
                                                    : "border-transparent hover:bg-secondary/60 hover:border-border"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                                                t.direction === "LONG" ? "bg-emerald-500/10" : "bg-red-500/10"
                                            )}>
                                                {t.direction === "LONG"
                                                    ? <TrendingUp size={14} className="text-emerald-400" />
                                                    : <TrendingDown size={14} className="text-red-400" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-foreground">{t.symbol}</p>
                                                <p className="text-[11px] text-muted-foreground">
                                                    {t.entryDate ? format(t.entryDate.toDate(), "MMM d, yyyy") : ""}
                                                    {" · "}
                                                    <span className={pnlPositive ? "text-emerald-400" : "text-red-400"}>
                                                        {pnlPositive ? "+" : ""}{(t.netPnl ?? 0).toFixed(2)}
                                                    </span>
                                                </p>
                                            </div>
                                            {t.status === "OPEN" && (
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400">OPEN</span>
                                            )}
                                            {isSelected && (
                                                <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                                                    <span className="w-1.5 h-1.5 bg-primary-foreground rounded-full" />
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex gap-3 pt-1">
                                <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={!selectedTrade}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Create Note
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2b: Daily Note — pick a date ── */}
                    {step === "daily" && (
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    Select date
                                </label>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    max={format(new Date(), "yyyy-MM-dd")}
                                    className="w-full px-3 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                                />
                                {selectedDate && (
                                    <p className="text-xs text-muted-foreground px-1">
                                        {format(new Date(selectedDate + "T00:00:00"), "EEEE, MMMM d, yyyy")}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={!selectedDate}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-50"
                                >
                                    Create Note
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2c: Personal / Custom — just a title ── */}
                    {step === "personal" && (
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Title</label>
                                <input
                                    type="text"
                                    placeholder="Note title..."
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    autoFocus
                                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                                    className="w-full px-3 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreate}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all"
                                >
                                    Create Note
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
