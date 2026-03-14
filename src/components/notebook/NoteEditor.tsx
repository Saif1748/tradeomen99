// src/components/notebook/NoteEditor.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { Note } from "@/types/notebook";
import { cn } from "@/lib/utils";
import {
    Star, Trash2, RotateCcw, X, Save, Briefcase,
    Calendar, User, FileText, Link, ExternalLink,
    Bold, Italic, Underline as UnderlineIcon, Strikethrough,
    ALargeSmall, Palette, Highlighter,
    List, ListOrdered, CheckSquare,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    Minus, ImageIcon, Link2, Link2Off,
    CornerUpLeft, CornerUpRight, Maximize2, Minimize2,
    ChevronDown,
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

// Tiptap
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Link2Ext from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";
import "./NoteEditor.css";

// Firebase Storage for image uploads
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

interface NoteEditorProps {
    note: Note;
    onUpdate: (noteId: string, changes: Partial<Pick<Note, "title" | "content" | "isStarred">>) => void;
    onSave: (noteId: string, changes: Partial<Pick<Note, "title" | "content" | "isStarred">>) => Promise<void>;
    onTrash: (noteId: string) => void;
    onRestore: (noteId: string) => void;
    onDeleteForever: (noteId: string) => void;
}

const categoryMeta = (cat: string) => {
    switch (cat) {
        case "Daily Note": return { icon: Calendar, color: "text-blue-400", bg: "bg-blue-500/10" };
        case "Trade Note": return { icon: Briefcase, color: "text-orange-400", bg: "bg-orange-500/10" };
        case "Personal Note": return { icon: User, color: "text-purple-400", bg: "bg-purple-500/10" };
        default: return { icon: FileText, color: "text-muted-foreground", bg: "bg-secondary" };
    }
};

// ─── Tiny toolbar button ────────────────────────────────────────────────────
const TBtn = ({
    onClick, active, title, disabled, children,
}: { onClick: () => void; active?: boolean; title: string; disabled?: boolean; children: React.ReactNode }) => (
    <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); onClick(); }}
        disabled={disabled}
        title={title}
        className={cn(
            "w-7 h-7 flex items-center justify-center rounded-md text-xs transition-colors shrink-0",
            active
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            disabled && "opacity-30 cursor-not-allowed"
        )}
    >
        {children}
    </button>
);

const Divider = () => <div className="w-px h-5 bg-border/70 mx-0.5 shrink-0" />;

// ─── Heading dropdown ────────────────────────────────────────────────────────
const HeadingDropdown = ({ editor }: { editor: any }) => {
    const [open, setOpen] = useState(false);

    const levels = [
        { label: "Paragraph", value: "paragraph" },
        { label: "Heading 1", value: 1 },
        { label: "Heading 2", value: 2 },
        { label: "Heading 3", value: 3 },
    ];

    const current = editor.isActive("heading", { level: 1 }) ? "Heading 1"
        : editor.isActive("heading", { level: 2 }) ? "Heading 2"
            : editor.isActive("heading", { level: 3 }) ? "Heading 3"
                : "Paragraph";

    return (
        <div className="relative">
            <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); setOpen((v) => !v); }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-foreground bg-secondary/50 hover:bg-secondary border border-border/50 transition-colors"
            >
                {current}
                <ChevronDown size={11} className={cn("transition-transform", open && "rotate-180")} />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute left-0 top-9 z-20 bg-card border border-border rounded-xl shadow-xl overflow-hidden min-w-[130px] animate-in fade-in zoom-in-95 duration-100">
                        {levels.map((l) => (
                            <button
                                key={l.label}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    if (l.value === "paragraph") editor.chain().focus().setParagraph().run();
                                    else editor.chain().focus().toggleHeading({ level: l.value as 1 | 2 | 3 }).run();
                                    setOpen(false);
                                }}
                                className={cn(
                                    "w-full px-3 py-2 text-left text-xs transition-colors",
                                    l.value !== "paragraph" && `font-${l.value === 1 ? "bold text-base" : l.value === 2 ? "semibold text-sm" : "medium text-xs"}`,
                                    current === l.label ? "bg-primary/10 text-primary" : "text-foreground hover:bg-secondary"
                                )}
                            >
                                {l.label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

// ─── Color picker button ────────────────────────────────────────────────────
const ColorPicker = ({ editor, type }: { editor: any; type: "text" | "highlight" }) => {
    const ref = useRef<HTMLInputElement>(null);
    const title = type === "text" ? "Text Color" : "Highlight Color";
    const Icon = type === "text" ? Palette : Highlighter;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (type === "text") editor.chain().focus().setColor(e.target.value).run();
        else editor.chain().focus().setHighlight({ color: e.target.value }).run();
    };

    return (
        <div className="relative">
            <button
                type="button"
                title={title}
                onMouseDown={(e) => { e.preventDefault(); ref.current?.click(); }}
                className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
                <Icon size={14} />
            </button>
            <input
                ref={ref}
                type="color"
                className="absolute opacity-0 w-0 h-0"
                onChange={handleChange}
            />
        </div>
    );
};

// ─── Main Editor ─────────────────────────────────────────────────────────────
export const NoteEditor = ({
    note, onUpdate, onSave, onTrash, onRestore, onDeleteForever,
}: NoteEditorProps) => {
    const navigate = useNavigate();
    const [title, setTitle] = useState(note.title);
    const [saving, setSaving] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);
    const [linkUrl, setLinkUrl] = useState("");
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Tiptap Editor instance ────────────────────────────────────────────────
    const editor = useEditor({
        extensions: [
            StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
            Underline,
            TextStyle,
            Color,
            Highlight.configure({ multicolor: true }),
            TextAlign.configure({ types: ["heading", "paragraph"] }),
            Image.configure({ allowBase64: true }),
            Link2Ext.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer" } }),
            TaskList,
            TaskItem.configure({ nested: true }),
            Placeholder.configure({ placeholder: "Start writing your note..." }),
        ],
        content: note.content || "",
        editable: !note.isTrashed,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            onUpdate(note.id, { content: html });
        },
    });

    // Sync when switching notes
    useEffect(() => {
        setTitle(note.title);
        if (editor && editor.getHTML() !== note.content) {
            editor.commands.setContent(note.content || "", false);
        }
        editor?.setEditable(!note.isTrashed);
    }, [note.id]);

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleTitleChange = (val: string) => {
        setTitle(val);
        onUpdate(note.id, { title: val });
    };

    const handleExplicitSave = async () => {
        setSaving(true);
        await onSave(note.id, { title, content: editor?.getHTML() ?? "" });
        setSaving(false);
    };

    const handleToggleStar = () => onSave(note.id, { isStarred: !note.isStarred });

    // Image upload via Firebase Storage
    const handleImageUpload = useCallback(async (file: File) => {
        try {
            setUploadingImage(true);
            const storage = getStorage();
            const ext = file.name.split(".").pop();
            const path = `notebook-images/${Date.now()}.${ext}`;
            const sRef = storageRef(storage, path);
            await uploadBytes(sRef, file);
            const url = await getDownloadURL(sRef);
            editor?.chain().focus().setImage({ src: url }).run();
        } catch (err) {
            console.error("Image upload failed", err);
        } finally {
            setUploadingImage(false);
        }
    }, [editor]);

    // Link insertion
    const handleSetLink = () => {
        if (!linkUrl) return;
        editor?.chain().focus().setLink({ href: linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}` }).run();
        setLinkUrl("");
        setShowLinkInput(false);
    };

    const { icon: CatIcon, color, bg } = categoryMeta(note.category);
    const createdStr = note.createdAt ? format(note.createdAt.toDate(), "MMM d, yyyy 'at' h:mm a") : "";
    const updatedStr = note.updatedAt ? format(note.updatedAt.toDate(), "MMM d, yyyy 'at' h:mm a") : "";

    if (!editor) return null;

    return (
        <div className={cn(
            "flex flex-col bg-card/30 transition-all duration-200",
            fullscreen && "fixed inset-0 z-50 bg-card"
        )}>
            {/* ── Top action bar ──────────────────────────── */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border shrink-0">
                {/* Category badge */}
                <span className={cn("flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg", bg, color)}>
                    <CatIcon size={12} />
                    {note.category}
                </span>
                <div className="flex-1" />

                {note.tradeId && (
                    <button
                        onClick={() => navigate(`/trades/${note.tradeId}`)}
                        className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                        <ExternalLink size={12} /> View Trade
                    </button>
                )}

                {/* Fullscreen toggle */}
                <button
                    onClick={() => setFullscreen((v) => !v)}
                    title={fullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                    {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>

                {note.isTrashed ? (
                    <>
                        <button onClick={() => onRestore(note.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors">
                            <RotateCcw size={13} /> Restore
                        </button>
                        <button onClick={() => onDeleteForever(note.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors">
                            <X size={13} /> Delete Forever
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={handleToggleStar}
                            className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                note.isStarred ? "text-amber-400 bg-amber-500/10 hover:bg-amber-500/20" : "text-muted-foreground hover:bg-secondary hover:text-amber-400"
                            )}
                            title={note.isStarred ? "Unstar" : "Star"}
                        >
                            <Star size={15} fill={note.isStarred ? "currentColor" : "none"} />
                        </button>
                        <button onClick={() => onTrash(note.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-colors" title="Move to Trash">
                            <Trash2 size={15} />
                        </button>
                        <button
                            onClick={handleExplicitSave}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
                        >
                            <Save size={13} />
                            {saving ? "Saving..." : "Save"}
                        </button>
                    </>
                )}
            </div>

            {/* ── Title ───────────────────────────────────── */}
            <div className="px-6 pt-5 pb-3 shrink-0">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Untitled"
                    disabled={note.isTrashed}
                    className="w-full bg-transparent text-2xl font-bold text-foreground placeholder:text-muted-foreground/30 focus:outline-none disabled:opacity-50"
                />
            </div>

            {/* ── Formatting Toolbar ───────────────────────── */}
            {!note.isTrashed && (
                <div className="border-t border-b border-border/60 px-3 py-2 shrink-0 bg-secondary/20">
                    {/* Row 1 */}
                    <div className="flex items-center gap-0.5 flex-wrap">
                        <HeadingDropdown editor={editor} />
                        <Divider />

                        {/* Text formatting */}
                        <TBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
                            <Bold size={13} />
                        </TBtn>
                        <TBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
                            <Italic size={13} />
                        </TBtn>
                        <TBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline">
                            <UnderlineIcon size={13} />
                        </TBtn>
                        <TBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
                            <Strikethrough size={13} />
                        </TBtn>

                        <Divider />

                        {/* Color */}
                        <ColorPicker editor={editor} type="text" />
                        <ColorPicker editor={editor} type="highlight" />

                        <Divider />

                        {/* Lists */}
                        <TBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet List">
                            <List size={13} />
                        </TBtn>
                        <TBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Ordered List">
                            <ListOrdered size={13} />
                        </TBtn>
                        <TBtn onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive("taskList")} title="Task List">
                            <CheckSquare size={13} />
                        </TBtn>

                        <Divider />

                        {/* Undo / Redo */}
                        <TBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
                            <CornerUpLeft size={13} />
                        </TBtn>
                        <TBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
                            <CornerUpRight size={13} />
                        </TBtn>
                    </div>

                    {/* Row 2 */}
                    <div className="flex items-center gap-0.5 flex-wrap mt-1">
                        {/* Alignment */}
                        <TBtn onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align Left">
                            <AlignLeft size={13} />
                        </TBtn>
                        <TBtn onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Align Center">
                            <AlignCenter size={13} />
                        </TBtn>
                        <TBtn onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align Right">
                            <AlignRight size={13} />
                        </TBtn>
                        <TBtn onClick={() => editor.chain().focus().setTextAlign("justify").run()} active={editor.isActive({ textAlign: "justify" })} title="Justify">
                            <AlignJustify size={13} />
                        </TBtn>

                        <Divider />

                        {/* Horizontal Rule */}
                        <TBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Line">
                            <Minus size={13} />
                        </TBtn>

                        <Divider />

                        {/* Image upload */}
                        <TBtn onClick={() => fileInputRef.current?.click()} title={uploadingImage ? "Uploading..." : "Insert Image"} disabled={uploadingImage}>
                            <ImageIcon size={13} />
                        </TBtn>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(file);
                                e.target.value = "";
                            }}
                        />

                        <Divider />

                        {/* Link */}
                        <TBtn
                            onClick={() => {
                                if (editor.isActive("link")) {
                                    editor.chain().focus().unsetLink().run();
                                } else {
                                    setShowLinkInput((v) => !v);
                                }
                            }}
                            active={editor.isActive("link") || showLinkInput}
                            title={editor.isActive("link") ? "Remove Link" : "Add Link"}
                        >
                            {editor.isActive("link") ? <Link2Off size={13} /> : <Link2 size={13} />}
                        </TBtn>

                        {/* Clear formatting */}
                        <TBtn onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Clear Formatting">
                            <ALargeSmall size={13} />
                        </TBtn>
                    </div>

                    {/* Link input bar */}
                    {showLinkInput && (
                        <div className="flex items-center gap-2 mt-2 animate-in fade-in slide-in-from-top-1 duration-150">
                            <div className="flex-1 flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5 focus-within:border-primary/50">
                                <Link size={12} className="text-muted-foreground shrink-0" />
                                <input
                                    autoFocus
                                    type="url"
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSetLink()}
                                    placeholder="https://example.com"
                                    className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none flex-1"
                                />
                            </div>
                            <button
                                type="button"
                                onMouseDown={(e) => { e.preventDefault(); handleSetLink(); }}
                                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                            >
                                Insert
                            </button>
                            <button
                                type="button"
                                onMouseDown={(e) => { e.preventDefault(); setShowLinkInput(false); setLinkUrl(""); }}
                                className="px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-secondary transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ── Editor Content ───────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
                <EditorContent editor={editor} className="tiptap-editor" />
            </div>

            {/* ── Footer ───────────────────────────────────── */}
            <div className="px-6 py-2.5 border-t border-border/60 flex items-center gap-4 shrink-0">
                <p className="text-[11px] text-muted-foreground/60">Created {createdStr}</p>
                {updatedStr && updatedStr !== createdStr && (
                    <p className="text-[11px] text-muted-foreground/60">· Updated {updatedStr}</p>
                )}
                {uploadingImage && (
                    <span className="text-[11px] text-primary animate-pulse ml-auto">Uploading image...</span>
                )}
            </div>
        </div>
    );
};
