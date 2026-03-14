import { motion } from "framer-motion";
import { X, Plus, ChatCircle, Clock } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatHistory {
  id: string;
  title: string;
  timestamp: string;
  preview: string;
}

interface ChatHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  currentChatId?: string;
  chats: ChatHistory[];
}

const ChatHistorySidebar = ({
  isOpen,
  onClose,
  onNewChat,
  onSelectChat,
  currentChatId,
  chats,
}: ChatHistorySidebarProps) => {
  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-40 ${
          isOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: isOpen ? 0 : "-100%" }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-card card-boundary border-r border-border z-50 flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <h2 className="text-sm font-medium text-foreground tracking-wide">Chat History</h2>
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
        <div className="px-4 pb-4">
          <Button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full h-10 gap-2 rounded-xl bg-primary/10 text-primary font-medium hover:bg-primary/20 border border-primary/20 shadow-sm"
            variant="ghost"
          >
            <Plus weight="bold" className="w-4 h-4" />
            New Chat
          </Button>
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1 px-2">
          <div className="space-y-1 pb-4">
            {chats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center mb-3">
                  <ChatCircle weight="regular" className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-foreground font-medium">No chat history yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Start a new conversation to begin
                </p>
              </div>
            ) : (
              chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => {
                    onSelectChat(chat.id);
                    onClose();
                  }}
                  className={`w-full text-left p-3 rounded-xl transition-all duration-150 ${
                    currentChatId === chat.id
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  }`}
                >
                  <p className="text-sm font-medium truncate">{chat.title}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {chat.preview}
                  </p>
                  <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground/70">
                    <Clock weight="regular" className="w-3 h-3" />
                    {chat.timestamp}
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </motion.div>
    </>
  );
};

export default ChatHistorySidebar;
