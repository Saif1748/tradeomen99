import { useState } from "react";
import {
  Search,
  Plus,
  ArrowUpDown,
  ListFilter,
  FileText,
  Calendar,
  Briefcase,
  User,
  Star,
  Trash2,
  FolderPlus,
  FileIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FolderItem {
  icon: React.ElementType;
  label: string;
  count: number;
}

const folders: FolderItem[] = [
  { icon: FileText, label: "All", count: 0 },
  { icon: Calendar, label: "Daily Note", count: 0 },
  { icon: Briefcase, label: "Trade Note", count: 0 },
  { icon: User, label: "Personal Note", count: 0 },
  { icon: Star, label: "Starred", count: 0 },
  { icon: Trash2, label: "Trash", count: 0 },
];

const Notebook = () => {
  const [activeFolder, setActiveFolder] = useState("All");

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
      
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Notebook</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your trading and personal notes</p>
      </div>

      {/* 3-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_1fr] rounded-2xl border border-border overflow-hidden min-h-[600px] card-boundary bg-card">
        
        {/* --- Left panel: Folders --- */}
        <div className="border-r border-border flex flex-col bg-card/50">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <button className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <FolderPlus size={16} />
              <span>Add Folder</span>
            </button>
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <ListFilter size={16} />
            </button>
          </div>
          
          <nav className="flex-1 p-3 space-y-1">
            {folders.map((folder) => {
              const isActive = activeFolder === folder.label;
              return (
                <button
                  key={folder.label}
                  onClick={() => setActiveFolder(folder.label)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 font-medium",
                    isActive
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  )}
                >
                  <folder.icon size={18} />
                  <span className="flex-1 text-left">{folder.label}</span>
                  <span className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded-md",
                    isActive ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                  )}>
                    {folder.count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* --- Middle panel: Notes List --- */}
        <div className="border-r border-border flex flex-col bg-card">
          <div className="flex items-center gap-2 p-4 border-b border-border">
            <div className="flex-1 flex items-center gap-2 bg-secondary/40 rounded-lg px-3 py-2 border border-border focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
              <Search size={16} className="text-muted-foreground" />
              <input
                type="text"
                placeholder="Search notes..."
                className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1"
              />
            </div>
            <button className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors border border-transparent hover:border-border">
              <ArrowUpDown size={16} />
            </button>
            <button className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
              <Plus size={16} />
            </button>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mb-4 border border-dashed border-border">
              <FileIcon size={28} className="text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold text-foreground">No Notes</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-[200px]">
              You have no notes in the "{activeFolder}" folder yet.
            </p>
          </div>
        </div>

        {/* --- Right panel: Note Detail --- */}
        <div className="flex flex-col items-center justify-center text-center p-6 bg-card/30">
          <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mb-4 border border-border shadow-sm">
            <FileText size={28} className="text-muted-foreground/50" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No Note Selected</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-[250px]">
            Please select a note from the list or create a new one to view its details.
          </p>
        </div>
        
      </div>
    </div>
  );
};

export default Notebook;