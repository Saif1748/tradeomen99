// src/pages/Notebook.tsx
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search, Plus, FileText,
  Calendar, Briefcase, User, Star, Trash2, FolderPlus,
  FileIcon, SortAsc, SortDesc, Folder, ListFilter,
  TrendingUp, TrendingDown, ExternalLink, BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useUser } from "@/contexts/UserContext";
import { useNotebook } from "@/hooks/useNotebook";
import { Note } from "@/types/notebook";
import { NoteListItem } from "@/components/notebook/NoteListItem";
import { NoteEditor } from "@/components/notebook/NoteEditor";
import { NewNoteModal } from "@/components/notebook/NewNoteModal";
import { CreateFolderModal } from "@/components/notebook/CreateFolderModal";
import { getAllTradesSimple } from "@/services/tradeService";
import { useNavigate } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";

// ─────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────
interface TradePick {
  id: string;
  symbol: string;
  direction: string;
  entryDate: any;
  netPnl: number;
  status: string;
  notes?: string;
}

// ─────────────────────────────────────────────────────
// Static folders
// ─────────────────────────────────────────────────────
interface FolderDef { icon: React.ElementType; label: string }

const STATIC_FOLDERS: FolderDef[] = [
  { icon: FileText, label: "All" },
  { icon: Calendar, label: "Daily Note" },
  { icon: Briefcase, label: "Trade Note" },
  { icon: User, label: "Personal Note" },
  { icon: Star, label: "Starred" },
  { icon: Trash2, label: "Trash" },
];

// ─────────────────────────────────────────────────────
// Sort + Filter helpers (for non-Trade-Note panels)
// ─────────────────────────────────────────────────────
type SortMode = "updated" | "created" | "alpha";

const filterNotes = (notes: Note[], folder: string, search: string): Note[] => {
  let filtered: Note[];
  if (folder === "Trash") {
    filtered = notes.filter((n) => n.isTrashed);
  } else if (folder === "Starred") {
    filtered = notes.filter((n) => n.isStarred && !n.isTrashed);
  } else if (folder === "All") {
    filtered = notes.filter((n) => !n.isTrashed);
  } else {
    filtered = notes.filter((n) => n.category === folder && !n.isTrashed);
  }
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
    );
  }
  return filtered;
};

const sortNotes = (notes: Note[], mode: SortMode, asc: boolean): Note[] => {
  const sorted = [...notes].sort((a, b) => {
    if (mode === "alpha") return a.title.localeCompare(b.title);
    const tA = mode === "updated" ? a.updatedAt?.toMillis() ?? 0 : a.createdAt?.toMillis() ?? 0;
    const tB = mode === "updated" ? b.updatedAt?.toMillis() ?? 0 : b.createdAt?.toMillis() ?? 0;
    return tB - tA;
  });
  return asc && mode === "alpha" ? sorted : asc ? sorted.reverse() : sorted;
};

// ─────────────────────────────────────────────────────
// Trade Note panel item — shows a trade with notes
// ─────────────────────────────────────────────────────
interface TradeNoteRowProps {
  trade: TradePick;
  linkedNote: Note | null;
  isSelected: boolean;
  onSelect: () => void;
  onNavigate: (id: string) => void;
}

const TradeNoteRow = ({ trade, linkedNote, isSelected, onSelect, onNavigate }: TradeNoteRowProps) => {
  const pnlPos = (trade.netPnl ?? 0) >= 0;
  // Use notebook note content if linked, otherwise trade.notes
  const noteContent = linkedNote ? linkedNote.content : (trade.notes ?? "");
  const snippet = noteContent.replace(/\n/g, " ").slice(0, 80);
  const isLong = trade.direction?.toUpperCase() === "LONG";

  return (
    <div
      onClick={onSelect}
      className={cn(
        "relative group flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-150 border",
        isSelected
          ? "bg-orange-500/10 border-orange-500/25 shadow-sm"
          : "hover:bg-secondary/60 border-transparent hover:border-border"
      )}
    >
      {/* Direction icon */}
      <div className={cn(
        "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
        isLong ? "bg-emerald-500/10" : "bg-red-500/10"
      )}>
        {isLong
          ? <TrendingUp size={16} className="text-emerald-400" />
          : <TrendingDown size={16} className="text-red-400" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn("text-sm font-bold leading-tight", isSelected ? "text-orange-400" : "text-foreground")}>
            {trade.symbol}
          </p>
          <span className={cn(
            "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
            pnlPos ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
          )}>
            {pnlPos ? "+" : ""}{(trade.netPnl ?? 0).toFixed(2)}
          </span>
          {linkedNote && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-orange-500/10 text-orange-400">
              Notebook
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {trade.entryDate ? format(trade.entryDate.toDate(), "MMM d, yyyy") : ""}
        </p>
        {snippet ? (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{snippet}</p>
        ) : (
          <p className="text-[11px] text-muted-foreground/50 mt-1 italic">No notes yet</p>
        )}
      </div>

      {/* Action: go to trade */}
      <button
        onClick={(e) => { e.stopPropagation(); onNavigate(trade.id); }}
        title="View Trade"
        className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-primary shrink-0"
      >
        <ExternalLink size={12} />
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────
const EmptyState = ({ folder, search, onNew }: { folder: string; search: string; onNew: () => void }) => (
  <div className="flex flex-col items-center justify-center text-center h-full py-12 px-4">
    <div className="w-14 h-14 rounded-2xl bg-secondary/50 flex items-center justify-center mb-3 border border-dashed border-border">
      <FileIcon size={24} className="text-muted-foreground/50" />
    </div>
    <h3 className="text-sm font-semibold text-foreground">
      {search ? "No Results" : "No Notes"}
    </h3>
    <p className="text-xs text-muted-foreground mt-1 max-w-[180px] leading-relaxed">
      {search
        ? `Nothing matches "${search}"`
        : folder === "Trash"
          ? "Your trash is empty."
          : folder === "Trade Note"
            ? "No trade notes yet. Select a trade to link a note."
            : folder === "Daily Note"
              ? "No daily notes yet. Pick a date to add one."
              : `No notes in "${folder}" yet.`}
    </p>
    {!search && folder !== "Trash" && (
      <button
        onClick={onNew}
        className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
      >
        <Plus size={12} /> New Note
      </button>
    )}
  </div>
);

// ─────────────────────────────────────────────────────
// 🗒️ Page
// ─────────────────────────────────────────────────────
const Notebook = () => {
  const { activeAccount } = useWorkspace();
  const { user } = useUser();
  const navigate = useNavigate();
  const accountId = activeAccount?.id;

  const {
    notes, folders: customFolders, isLoading,
    createNote, updateNote, saveNote,
    trashNote, restoreNote, deleteNote, createFolder,
  } = useNotebook(accountId);

  // Fetch all trades (for Trade Note view — includes trade.notes field)
  const { data: allTrades = [], isLoading: tradesLoading } = useQuery({
    queryKey: ["notebook-trades", accountId],
    queryFn: () => getAllTradesSimple(accountId!),
    enabled: !!accountId,
    staleTime: 1000 * 60 * 5,
  });

  // ── UI state ───────────────────────────────────────
  const [activeFolder, setActiveFolder] = useState("All");
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("updated");
  const [sortAsc, setSortAsc] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showNewNoteModal, setShowNewNoteModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);

  // ── Derived ────────────────────────────────────────
  const customFolderNames = useMemo(() => customFolders.map((f) => f.name), [customFolders]);

  const allFolders: FolderDef[] = useMemo(() => [
    ...STATIC_FOLDERS,
    ...customFolders.map((f) => ({ icon: Folder, label: f.name })),
  ], [customFolders]);

  const getNoteCount = (label: string): number => {
    if (label === "Trade Note") {
      // Count unique trades that have either trade.notes OR a linked notebook note
      const tradesToShow = buildTradeNoteList(allTrades, notes, "");
      return tradesToShow.length;
    }
    if (label === "Trash") return notes.filter((n) => n.isTrashed).length;
    if (label === "Starred") return notes.filter((n) => n.isStarred && !n.isTrashed).length;
    if (label === "All") return notes.filter((n) => !n.isTrashed).length;
    return notes.filter((n) => n.category === label && !n.isTrashed).length;
  };

  const filteredNotes = useMemo(
    () => sortNotes(filterNotes(notes, activeFolder, search), sortMode, sortAsc),
    [notes, activeFolder, search, sortMode, sortAsc]
  );

  // ── Trade Note merged list ─────────────────────────
  // Trades shown: those with non-empty trade.notes OR linked notebook notes
  const tradeNoteItems = useMemo(
    () => buildTradeNoteList(allTrades, notes, search),
    [allTrades, notes, search]
  );

  const selectedNote = useMemo(
    () => notes.find((n) => n.id === selectedNoteId) ?? null,
    [notes, selectedNoteId]
  );

  // For Trade Note view: the linked notebook note for the selected trade
  const selectedTradeLinkedNote = useMemo(() => {
    if (!selectedTradeId) return null;
    return notes.find((n) => n.tradeId === selectedTradeId && !n.isTrashed) ?? null;
  }, [notes, selectedTradeId]);

  const selectedTrade = useMemo(
    () => allTrades.find((t) => t.id === selectedTradeId) ?? null,
    [allTrades, selectedTradeId]
  );

  // ── Handlers ───────────────────────────────────────
  const handleCreateNote = (data: {
    title: string; category: string; content?: string;
    tradeId?: string; tradeDate?: string;
  }) => {
    if (!user) return;
    createNote({ ...data, userId: user.uid });
  };

  const handleFolderChange = (label: string) => {
    setActiveFolder(label);
    setSelectedNoteId(null);
    setSelectedTradeId(null);
    setSearch("");
  };

  const handleTrash = (id: string) => {
    if (selectedNoteId === id) setSelectedNoteId(null);
    trashNote(id);
  };

  const handleSortSelect = (mode: SortMode) => {
    if (sortMode === mode) setSortAsc((v) => !v);
    else { setSortMode(mode); setSortAsc(false); }
    setShowSortMenu(false);
  };

  const newNoteDefaultCategory =
    activeFolder === "All" || activeFolder === "Starred" || activeFolder === "Trash"
      ? "Personal Note"
      : activeFolder;

  const isTradeNoteFolder = activeFolder === "Trade Note";

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Notebook</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your trading and personal notes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_300px_1fr] rounded-2xl border border-border overflow-hidden min-h-[680px] card-boundary bg-card">

        {/* ── LEFT: Folders ─────────────────────────── */}
        <div className="border-r border-border flex flex-col bg-card/50">
          <div className="flex items-center justify-between p-3.5 border-b border-border">
            <button
              onClick={() => setShowFolderModal(true)}
              className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <FolderPlus size={14} /> New Folder
            </button>
            <button onClick={() => setShowFolderModal(true)} className="text-muted-foreground hover:text-foreground transition-colors">
              <ListFilter size={14} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-2.5 space-y-0.5">
            {allFolders.map((folder) => {
              const isActive = activeFolder === folder.label;
              const count = getNoteCount(folder.label);
              return (
                <button
                  key={folder.label}
                  onClick={() => handleFolderChange(folder.label)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all duration-150 font-medium",
                    isActive ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  )}
                >
                  <folder.icon size={15} />
                  <span className="flex-1 text-left truncate">{folder.label}</span>
                  {count > 0 && (
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded-md min-w-[18px] text-center",
                      isActive ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                    )}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* ── MIDDLE: Note List ─────────────────────── */}
        <div className="border-r border-border flex flex-col bg-card">
          <div className="flex items-center gap-2 p-3 border-b border-border shrink-0">
            <div className="flex-1 flex items-center gap-2 bg-secondary/40 rounded-lg px-2.5 py-1.5 border border-border focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
              <Search size={13} className="text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder={isTradeNoteFolder ? "Search by symbol..." : "Search notes..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none flex-1 min-w-0"
              />
            </div>

            {!isTradeNoteFolder && (
              <div className="relative">
                <button
                  onClick={() => setShowSortMenu((v) => !v)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors border border-transparent hover:border-border"
                >
                  {sortAsc ? <SortAsc size={14} /> : <SortDesc size={14} />}
                </button>
                {showSortMenu && (
                  <div className="absolute right-0 top-10 z-20 bg-card border border-border rounded-xl shadow-xl overflow-hidden w-40 animate-in fade-in zoom-in-95 duration-150">
                    {(["updated", "created", "alpha"] as SortMode[]).map((m) => (
                      <button
                        key={m}
                        onClick={() => handleSortSelect(m)}
                        className={cn(
                          "w-full px-3 py-2 text-xs text-left capitalize transition-colors",
                          sortMode === m ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        )}
                      >
                        {m === "updated" ? "Last Modified" : m === "created" ? "Date Created" : "A → Z"}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setShowNewNoteModal(true)}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm shrink-0"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Category context hint */}
          {(isTradeNoteFolder || activeFolder === "Daily Note") && !search && (
            <div className={cn(
              "px-3 py-2 text-[11px] font-medium border-b border-border flex items-center gap-2",
              isTradeNoteFolder ? "bg-orange-500/5 text-orange-400" : "bg-blue-500/5 text-blue-400"
            )}>
              {isTradeNoteFolder ? <Briefcase size={11} /> : <Calendar size={11} />}
              {isTradeNoteFolder
                ? "Trades with notes from your journal"
                : "Notes for specific days"}
            </div>
          )}

          {/* List */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
            {isTradeNoteFolder ? (
              // ── TRADE NOTE: merged trade rows ────────
              (tradesLoading || isLoading) ? (
                <div className="flex flex-col gap-2 p-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 rounded-xl bg-secondary/30 animate-pulse" />
                  ))}
                </div>
              ) : tradeNoteItems.length === 0 ? (
                <EmptyState folder="Trade Note" search={search} onNew={() => setShowNewNoteModal(true)} />
              ) : (
                tradeNoteItems.map(({ trade, linkedNote }) => (
                  <TradeNoteRow
                    key={trade.id}
                    trade={trade}
                    linkedNote={linkedNote}
                    isSelected={selectedTradeId === trade.id}
                    onSelect={() => {
                      setSelectedTradeId(trade.id);
                      setSelectedNoteId(linkedNote?.id ?? null);
                    }}
                    onNavigate={(id) => navigate(`/trades/${id}`)}
                  />
                ))
              )
            ) : (
              // ── OTHER FOLDERS: regular note list ──────
              isLoading ? (
                <div className="flex flex-col gap-2 p-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 rounded-xl bg-secondary/30 animate-pulse" />
                  ))}
                </div>
              ) : filteredNotes.length === 0 ? (
                <EmptyState folder={activeFolder} search={search} onNew={() => setShowNewNoteModal(true)} />
              ) : (
                filteredNotes.map((note) => (
                  <NoteListItem
                    key={note.id}
                    note={note}
                    isSelected={selectedNoteId === note.id}
                    onSelect={() => setSelectedNoteId(note.id)}
                    onTrash={handleTrash}
                    onRestore={restoreNote}
                    onDeleteForever={deleteNote}
                    onToggleStar={(id, current) => saveNote(id, { isStarred: !current })}
                  />
                ))
              )
            )}
          </div>
        </div>

        {/* ── RIGHT: Editor / Trade Note Detail ──────── */}
        <div className="flex flex-col bg-card/30">
          {isTradeNoteFolder && selectedTrade ? (
            // Trade note detail panel
            <TradeNoteDetail
              trade={selectedTrade}
              linkedNote={selectedTradeLinkedNote}
              onSave={saveNote}
              onCreateNote={(tradeId, symbol) => {
                if (!user) return;
                createNote({
                  title: `${symbol} — Trade Note`,
                  category: "Trade Note",
                  content: "",
                  tradeId,
                  userId: user.uid,
                });
              }}
              onTrash={handleTrash}
              onNavigate={(id) => navigate(`/trades/${id}`)}
            />
          ) : selectedNote ? (
            <NoteEditor
              note={selectedNote}
              onUpdate={updateNote}
              onSave={saveNote}
              onTrash={handleTrash}
              onRestore={restoreNote}
              onDeleteForever={deleteNote}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-8 h-full">
              <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mb-4 border border-border shadow-inner">
                <FileText size={28} className="text-muted-foreground/40" />
              </div>
              <h3 className="text-base font-semibold text-foreground">No Note Selected</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-[240px] leading-relaxed">
                {isTradeNoteFolder
                  ? "Select a trade from the list to view its note."
                  : activeFolder === "Daily Note"
                    ? "Select a day's note from the list."
                    : "Select a note or create a new one."}
              </p>
              <button
                onClick={() => setShowNewNoteModal(true)}
                className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
              >
                <Plus size={15} /> New Note
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────── */}
      <NewNoteModal
        open={showNewNoteModal}
        onClose={() => setShowNewNoteModal(false)}
        onCreate={handleCreateNote}
        customFolders={customFolderNames}
        defaultCategory={newNoteDefaultCategory}
        accountId={accountId}
      />

      <CreateFolderModal
        open={showFolderModal}
        onClose={() => setShowFolderModal(false)}
        onCreate={createFolder}
      />

      {showSortMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────
// Build Trade Note merged list
// ─────────────────────────────────────────────────────
function buildTradeNoteList(
  trades: TradePick[],
  notes: Note[],
  search: string
): { trade: TradePick; linkedNote: Note | null }[] {
  // All notebook notes linked to a trade
  const linkedNoteMap = new Map<string, Note>();
  notes.filter((n) => n.tradeId && !n.isTrashed && n.category === "Trade Note")
    .forEach((n) => { if (n.tradeId) linkedNoteMap.set(n.tradeId, n); });

  // Trades eligible: have trade.notes OR a linked notebook note
  const eligible = trades.filter(
    (t) => (t.notes && t.notes.trim().length > 0) || linkedNoteMap.has(t.id)
  );

  // Filter by search
  const filtered = search.trim()
    ? eligible.filter((t) => t.symbol.toLowerCase().includes(search.toLowerCase()))
    : eligible;

  return filtered.map((trade) => ({
    trade,
    linkedNote: linkedNoteMap.get(trade.id) ?? null,
  }));
}

// ─────────────────────────────────────────────────────
// Trade Note Detail — right panel for Trade Note folder
// ─────────────────────────────────────────────────────
interface TradeNoteDetailProps {
  trade: TradePick;
  linkedNote: Note | null;
  onSave: (id: string, updates: Partial<Note>) => void;
  onCreateNote: (tradeId: string, symbol: string) => void;
  onTrash: (id: string) => void;
  onNavigate: (tradeId: string) => void;
}

const TradeNoteDetail = ({
  trade, linkedNote, onSave, onCreateNote, onTrash, onNavigate,
}: TradeNoteDetailProps) => {
  const [editTitle, setEditTitle] = useState(linkedNote?.title ?? "");
  const [editContent, setEditContent] = useState(linkedNote?.content ?? trade.notes ?? "");
  const [saving, setSaving] = useState(false);

  // Sync when trade/note changes
  useMemo(() => {
    setEditTitle(linkedNote?.title ?? `${trade.symbol} — Trade Note`);
    setEditContent(linkedNote?.content ?? trade.notes ?? "");
  }, [linkedNote?.id, trade.id]);

  const pnlPos = (trade.netPnl ?? 0) >= 0;
  const isLong = trade.direction?.toUpperCase() === "LONG";

  const handleSave = async () => {
    if (!linkedNote) {
      // No notebook note yet — create one with current content
      onCreateNote(trade.id, trade.symbol);
      return;
    }
    setSaving(true);
    await onSave(linkedNote.id, { title: editTitle, content: editContent });
    setSaving(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Trade header */}
      <div className="p-4 border-b border-border flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          isLong ? "bg-emerald-500/10" : "bg-red-500/10"
        )}>
          {isLong
            ? <TrendingUp size={18} className="text-emerald-400" />
            : <TrendingDown size={18} className="text-red-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-foreground">{trade.symbol}</h2>
            <span className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
              pnlPos ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
            )}>
              {pnlPos ? "+" : ""}{(trade.netPnl ?? 0).toFixed(2)}
            </span>
            <span className={cn(
              "text-[10px] capitalize font-medium px-1.5 py-0.5 rounded-md",
              isLong ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
            )}>
              {trade.direction}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {trade.entryDate ? format(trade.entryDate.toDate(), "EEE, MMM d, yyyy") : ""}
          </p>
        </div>
        <button
          onClick={() => onNavigate(trade.id)}
          className="flex items-center gap-1.5 text-xs text-primary hover:underline shrink-0"
        >
          <ExternalLink size={12} /> View Trade
        </button>
      </div>

      {/* Note area */}
      <div className="flex-1 flex flex-col p-4 gap-3 overflow-y-auto">
        {/* Info badge if showing trade.notes (not yet a notebook note) */}
        {!linkedNote && trade.notes && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-orange-500/8 border border-orange-500/15 text-xs text-orange-400">
            <BookOpen size={13} className="mt-0.5 shrink-0" />
            <span>
              This note is from the trade form. Save it to convert to a full Notebook note with editing history.
            </span>
          </div>
        )}

        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="Note title..."
          className="w-full bg-secondary/40 border border-border rounded-xl px-3 py-2 text-sm font-semibold text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
        />

        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          placeholder="Write your trade analysis, observations, and lessons..."
          className="flex-1 w-full min-h-[260px] bg-secondary/40 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all resize-none leading-relaxed"
        />
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border flex items-center justify-between shrink-0">
        <div className="text-[11px] text-muted-foreground">
          {linkedNote?.updatedAt
            ? `Updated ${formatDistanceToNow(linkedNote.updatedAt.toDate(), { addSuffix: true })}`
            : "Not yet saved to Notebook"}
        </div>
        <div className="flex items-center gap-2">
          {linkedNote && (
            <button
              onClick={() => onTrash(linkedNote.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Delete
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center gap-1.5"
          >
            {saving ? "Saving..." : linkedNote ? "Save" : "Save to Notebook"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notebook;