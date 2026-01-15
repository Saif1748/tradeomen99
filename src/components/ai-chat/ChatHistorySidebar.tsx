// src/components/ai-chat/ChatHistorySidebar.tsx

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  X, 
  Plus, 
  ChatCircle, 
  DotsThree, 
  PencilSimple, 
  Trash, 
  Archive,
  Check,
  X as XIcon
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ChatSession } from "@/services/api/types";

// Helper to format timestamps relative to now (e.g. "2 hours ago", "Dec 12")
const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 24 && now.getDate() === date.getDate()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

interface ChatHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  currentChatId?: string;
  chats: ChatSession[];
  onRenameChat?: (id: string, newTitle: string) => void;
  onDeleteChat?: (id: string) => void;
  onArchiveChat?: (id: string) => void;
}

const ChatHistorySidebar = ({
  isOpen,
  onClose,
  onNewChat,
  onSelectChat,
  currentChatId,
  chats,
  onRenameChat,
  onDeleteChat,
  onArchiveChat
}: ChatHistorySidebarProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const startEditing = (chat: ChatSession) => {
    setEditingId(chat.id);
    setEditTitle(chat.topic);
  };

  const saveTitle = () => {
    if (editingId && onRenameChat) {
      onRenameChat(editingId, editTitle);
    }
    setEditingId(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle("");
  };

  return (
    <TooltipProvider delayDuration={300}>
      <>
        {/* Overlay for mobile (closes on click) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isOpen ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden",
            isOpen ? "pointer-events-auto" : "pointer-events-none"
          )}
          onClick={onClose}
        />

        {/* Sidebar Panel */}
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: isOpen ? 0 : "-100%" }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="fixed left-0 top-0 h-full w-72 bg-card/95 backdrop-blur-xl border-r border-border/50 z-50 flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 flex-shrink-0">
            <h2 className="text-sm font-semibold text-foreground tracking-tight">History</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            >
              <X weight="bold" className="w-4 h-4" />
            </Button>
          </div>

          {/* New Chat Button */}
          <div className="px-3 pb-2 flex-shrink-0">
            <Button
              onClick={() => {
                onNewChat();
                // Close sidebar on mobile when creating new chat
                if (window.innerWidth < 768) onClose();
              }}
              className="w-full justify-start gap-3 rounded-xl bg-background border border-border/50 shadow-sm hover:bg-secondary/50 text-foreground transition-all h-11"
              variant="outline"
            >
              <Plus weight="bold" className="w-4 h-4" />
              <span>New Chat</span>
            </Button>
          </div>

          {/* Chat List */}
          <ScrollArea className="flex-1 px-3 py-2">
            <div className="space-y-1 pb-4">
              {chats.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center opacity-50">
                  <ChatCircle weight="thin" className="w-12 h-12 mb-2" />
                  <p className="text-sm">No chats yet</p>
                </div>
              ) : (
                chats.map((chat) => (
                  <div key={chat.id} className="relative group">
                    {editingId === chat.id ? (
                      /* Editing Mode */
                      <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary/50 border border-primary/20">
                        <Input 
                          value={editTitle} 
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="h-7 text-xs bg-background border-none focus-visible:ring-0 px-2"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveTitle();
                            if (e.key === 'Escape') cancelEditing();
                          }}
                        />
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-green-500 hover:text-green-600 hover:bg-green-500/10" onClick={saveTitle}>
                          <Check weight="bold" className="w-3 h-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={cancelEditing}>
                          <XIcon weight="bold" className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      /* Display Mode */
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => {
                              onSelectChat(chat.id);
                              // Close on mobile selection, keep open on desktop
                              if (window.innerWidth < 768) onClose();
                            }}
                            className={cn(
                              "relative w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group-hover:pr-8",
                              currentChatId === chat.id
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                            )}
                          >
                            <ChatCircle 
                              weight={currentChatId === chat.id ? "fill" : "regular"} 
                              className="w-4 h-4 flex-shrink-0" 
                            />
                            
                            <span className="truncate flex-1">
                              {chat.topic}
                            </span>

                            {/* Hover Gradient Mask */}
                            {currentChatId !== chat.id && (
                              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card/95 to-transparent pointer-events-none group-hover:opacity-0 transition-opacity" />
                            )}
                          </button>
                        </TooltipTrigger>
                        
                        <TooltipContent side="right" className="bg-popover text-popover-foreground border-border text-xs shadow-xl translate-x-2">
                          {chat.topic}
                          <div className="text-[10px] text-muted-foreground mt-1 opacity-70 font-normal">
                            {formatTime(chat.created_at)}
                          </div>
                        </TooltipContent>

                        {/* Context Menu */}
                        <div className={cn(
                          "absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        )}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 rounded-md hover:bg-background shadow-sm border border-transparent hover:border-border/50 text-muted-foreground"
                                onClick={(e) => e.stopPropagation()} 
                              >
                                <DotsThree weight="bold" className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-40 bg-popover/95 backdrop-blur-lg border-border">
                              <DropdownMenuItem onClick={() => startEditing(chat)} className="gap-2 text-xs cursor-pointer">
                                <PencilSimple className="w-3.5 h-3.5" />
                                Rename
                              </DropdownMenuItem>
                              {onArchiveChat && (
                                <DropdownMenuItem onClick={() => onArchiveChat(chat.id)} className="gap-2 text-xs cursor-pointer">
                                  <Archive className="w-3.5 h-3.5" />
                                  Archive
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {onDeleteChat && (
                                <DropdownMenuItem 
                                  onClick={() => onDeleteChat(chat.id)} 
                                  className="gap-2 text-xs text-destructive focus:text-destructive cursor-pointer"
                                >
                                  <Trash className="w-3.5 h-3.5" />
                                  Delete chat
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </Tooltip>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </motion.div>
      </>
    </TooltipProvider>
  );
};

export default ChatHistorySidebar;