// src/components/notebook/NoteListItem.tsx
import { Note } from "@/types/notebook";
import { cn } from "@/lib/utils";
import {
    Star,
    Trash2,
    RotateCcw,
    X,
    Calendar,
    Briefcase,
    User,
    FileText,
    TrendingUp,
    TrendingDown,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

/** Strip HTML tags for list-item snippet display */
const stripHtml = (html: string): string => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
};

interface NoteListItemProps {
    note: Note;
    isSelected: boolean;
    onSelect: () => void;
    onTrash: (id: string) => void;
    onRestore: (id: string) => void;
    onDeleteForever: (id: string) => void;
    onToggleStar: (id: string, current: boolean) => void;
}

const categoryColor = (cat: string) => {
    switch (cat) {
        case "Daily Note": return "bg-blue-500/15 text-blue-400";
        case "Trade Note": return "bg-orange-500/15 text-orange-400";
        case "Personal Note": return "bg-purple-500/15 text-purple-400";
        default: return "bg-secondary text-muted-foreground";
    }
};

// ─── Trade Note item ────────────────────────────────────────────────────────
const TradeNoteItem = ({
    note, isSelected, onSelect, onTrash, onRestore, onDeleteForever, onToggleStar,
}: NoteListItemProps) => {
    // title is normally "SYMBOL — Trade Note"
    const symbol = note.title.split("—")[0].trim() || note.title;
    const plain = stripHtml(note.content);
    const hasContent = !!plain;
    const snippet = plain.slice(0, 60);

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
            {/* Icon */}
            <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <Briefcase size={16} className="text-orange-400" />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className={cn("text-sm font-bold leading-tight", isSelected ? "text-orange-400" : "text-foreground")}>
                        {symbol}
                    </p>
                    <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-md">
                        Trade Note
                    </span>
                </div>
                {hasContent ? (
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{snippet}</p>
                ) : (
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5 italic">No content yet</p>
                )}
                <p className="text-[10px] text-muted-foreground mt-1">
                    {note.updatedAt ? formatDistanceToNow(note.updatedAt.toDate(), { addSuffix: true }) : ""}
                </p>
            </div>

            {/* Hover actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                {note.isTrashed ? (
                    <>
                        <ActionBtn onClick={() => onRestore(note.id)} title="Restore" className="hover:text-emerald-400 hover:bg-emerald-500/10"><RotateCcw size={12} /></ActionBtn>
                        <ActionBtn onClick={() => onDeleteForever(note.id)} title="Delete Forever" className="hover:text-red-400 hover:bg-red-500/10"><X size={12} /></ActionBtn>
                    </>
                ) : (
                    <>
                        <ActionBtn onClick={() => onToggleStar(note.id, note.isStarred)} title={note.isStarred ? "Unstar" : "Star"} className={note.isStarred ? "text-amber-400 hover:text-amber-300" : "hover:text-amber-400 hover:bg-amber-500/10"}>
                            <Star size={12} fill={note.isStarred ? "currentColor" : "none"} />
                        </ActionBtn>
                        <ActionBtn onClick={() => onTrash(note.id)} title="Trash" className="hover:text-red-400 hover:bg-red-500/10"><Trash2 size={12} /></ActionBtn>
                    </>
                )}
            </div>
        </div>
    );
};

// ─── Daily Note item ─────────────────────────────────────────────────────────
const DailyNoteItem = ({
    note, isSelected, onSelect, onTrash, onRestore, onDeleteForever, onToggleStar,
}: NoteListItemProps) => {
    const snippet = stripHtml(note.content).slice(0, 70);

    // Parse dateStr from tradeDate or title
    let displayDate = note.tradeDate || "";
    let dayLabel = "";
    let dateLabel = "";
    try {
        if (displayDate) {
            const d = new Date(displayDate + "T00:00:00");
            dayLabel = format(d, "EEE").toUpperCase();
            dateLabel = format(d, "MMM d, yyyy");
        }
    } catch { }

    return (
        <div
            onClick={onSelect}
            className={cn(
                "relative group flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-150 border",
                isSelected
                    ? "bg-blue-500/10 border-blue-500/25 shadow-sm"
                    : "hover:bg-secondary/60 border-transparent hover:border-border"
            )}
        >
            {/* Date badge */}
            <div className={cn(
                "w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 border",
                isSelected ? "bg-blue-500/20 border-blue-500/30" : "bg-secondary/60 border-border"
            )}>
                <span className="text-[9px] font-bold text-muted-foreground leading-none">{dayLabel}</span>
                <Calendar size={14} className={cn("mt-0.5", isSelected ? "text-blue-400" : "text-muted-foreground")} />
            </div>

            <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-semibold leading-tight", isSelected ? "text-blue-400" : "text-foreground")}>
                    {dateLabel || note.title}
                </p>
                {snippet ? (
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{snippet}</p>
                ) : (
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5 italic">No content yet</p>
                )}
            </div>

            {/* Hover actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                {note.isTrashed ? (
                    <>
                        <ActionBtn onClick={() => onRestore(note.id)} title="Restore" className="hover:text-emerald-400 hover:bg-emerald-500/10"><RotateCcw size={12} /></ActionBtn>
                        <ActionBtn onClick={() => onDeleteForever(note.id)} title="Delete Forever" className="hover:text-red-400 hover:bg-red-500/10"><X size={12} /></ActionBtn>
                    </>
                ) : (
                    <>
                        <ActionBtn onClick={() => onToggleStar(note.id, note.isStarred)} title={note.isStarred ? "Unstar" : "Star"} className={note.isStarred ? "text-amber-400" : "hover:text-amber-400 hover:bg-amber-500/10"}>
                            <Star size={12} fill={note.isStarred ? "currentColor" : "none"} />
                        </ActionBtn>
                        <ActionBtn onClick={() => onTrash(note.id)} title="Trash" className="hover:text-red-400 hover:bg-red-500/10"><Trash2 size={12} /></ActionBtn>
                    </>
                )}
            </div>
        </div>
    );
};

// ─── Generic (Personal / Custom) item ───────────────────────────────────────
const GenericNoteItem = ({
    note, isSelected, onSelect, onTrash, onRestore, onDeleteForever, onToggleStar,
}: NoteListItemProps) => {
    const timeAgo = note.updatedAt ? formatDistanceToNow(note.updatedAt.toDate(), { addSuffix: true }) : "";
    const snippet = stripHtml(note.content).slice(0, 80);

    return (
        <div
            onClick={onSelect}
            className={cn(
                "relative group flex flex-col gap-1.5 p-3 rounded-xl cursor-pointer transition-all duration-150 border",
                isSelected ? "bg-primary/10 border-primary/30 shadow-sm" : "hover:bg-secondary/60 border-transparent hover:border-border"
            )}
        >
            <div className="flex items-start gap-2">
                <p className={cn("flex-1 text-sm font-semibold leading-tight line-clamp-1", isSelected ? "text-primary" : "text-foreground")}>
                    {note.title || "Untitled"}
                </p>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    {note.isTrashed ? (
                        <>
                            <ActionBtn onClick={() => onRestore(note.id)} title="Restore" className="hover:text-emerald-400 hover:bg-emerald-500/10"><RotateCcw size={12} /></ActionBtn>
                            <ActionBtn onClick={() => onDeleteForever(note.id)} title="Delete Forever" className="hover:text-red-400 hover:bg-red-500/10"><X size={12} /></ActionBtn>
                        </>
                    ) : (
                        <>
                            <ActionBtn onClick={() => onToggleStar(note.id, note.isStarred)} title={note.isStarred ? "Unstar" : "Star"} className={note.isStarred ? "text-amber-400" : "hover:text-amber-400 hover:bg-amber-500/10"}>
                                <Star size={12} fill={note.isStarred ? "currentColor" : "none"} />
                            </ActionBtn>
                            <ActionBtn onClick={() => onTrash(note.id)} title="Trash" className="hover:text-red-400 hover:bg-red-500/10"><Trash2 size={12} /></ActionBtn>
                        </>
                    )}
                </div>
            </div>
            {snippet && <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{snippet}</p>}
            <div className="flex items-center gap-2 mt-0.5">
                <span className={cn("flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md", categoryColor(note.category))}>
                    {note.category}
                </span>
                <span className="text-[10px] text-muted-foreground ml-auto">{timeAgo}</span>
            </div>
        </div>
    );
};

// ─── Shared tiny action button ───────────────────────────────────────────────
const ActionBtn = ({ onClick, title, className, children }: {
    onClick: () => void; title: string; className?: string; children: React.ReactNode;
}) => (
    <button
        onClick={onClick}
        title={title}
        className={cn("w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground transition-colors", className)}
    >
        {children}
    </button>
);

// ─── Smart dispatcher ────────────────────────────────────────────────────────
export const NoteListItem = (props: NoteListItemProps) => {
    const { note } = props;
    if (note.category === "Trade Note") return <TradeNoteItem {...props} />;
    if (note.category === "Daily Note") return <DailyNoteItem {...props} />;
    return <GenericNoteItem {...props} />;
};
