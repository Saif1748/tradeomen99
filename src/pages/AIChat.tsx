// src/components/AIChat.tsx

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatCircle, Lightning, List } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query"; // ✅ Added for Caching

// Layout & Components
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ChatMessage from "@/components/ai-chat/ChatMessage";
import ChatInput from "@/components/ai-chat/ChatInput";
import ChatHistorySidebar from "@/components/ai-chat/ChatHistorySidebar";
import ThinkingIndicator from "@/components/ai-chat/ThinkingIndicator";
import EmptyState from "@/components/ai-chat/EmptyState";
import MobileSidebar from "@/components/dashboard/MobileSidebar";

// API
import { aiApi } from "@/services/api/modules/ai";
import type { ChatSession } from "@/services/api/types";

// Local UI Message Interface
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: File[];
  isStreaming?: boolean;
}

const AIChat = () => {
  const queryClient = useQueryClient(); // ✅ Query Client for manual cache updates

  // State
  // We keep 'messages' as local state to preserve your Optimistic UI logic perfectly
  const [messages, setMessages] = useState<Message[]>([]);
  
  // ✅ REPLACED: Local 'sessions' state with Cached Query
  const { data: sessions = [], refetch: refetchSessions } = useQuery({
    queryKey: ["chat-sessions"],
    queryFn: aiApi.getSessions,
    staleTime: 1000 * 60 * 5, // Cache sessions for 5 minutes
  });

  const [isLoading, setIsLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | undefined>();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const hasMessages = messages.length > 0;

  // ✅ REPLACED: 'loadSessionMessages' function with a Query
  const { data: historyData, isLoading: isHistoryLoading } = useQuery({
    queryKey: ["chat-history", currentChatId],
    queryFn: () => aiApi.getHistory(currentChatId!),
    enabled: !!currentChatId, // Only fetch if we have an ID
    staleTime: 1000 * 60 * 5, // Cache history for 5 minutes
  });

  // ✅ NEW: Sync Cached History to Local State
  // This ensures that when you click a sidebar item, the messages load instantly from cache
  useEffect(() => {
    if (currentChatId && historyData) {
      const uiMessages: Message[] = historyData.map((msg) => ({
        id: msg.id || Date.now().toString(),
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));
      setMessages(uiMessages);
    } else if (!currentChatId) {
      // If we are in "New Chat" mode, clear messages
      setMessages([]);
    }
  }, [currentChatId, historyData]);

  // 2. Auto-scroll to bottom (Kept as is)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isHistoryLoading]);

  // --- Event Handlers ---

  const handleSend = async (text: string, attachments?: File[]) => {
    if (!text.trim() && (!attachments || attachments.length === 0)) return;

    // 1. Optimistically add User Message (Kept exactly as your code)
    const tempId = Date.now().toString();
    const userMsg: Message = {
      id: tempId,
      role: "user",
      content: text,
      attachments: attachments,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      let activeSessionId = currentChatId || "";
      let uploadedContext = "";

      // 2. Handle File Uploads
      if (attachments && attachments.length > 0) {
        try {
          const uploadRes = await aiApi.uploadFile(attachments[0], activeSessionId || "new", text);
          uploadedContext = `\n\n[System: User uploaded file '${uploadRes.filename}'. Analysis preview: ${uploadRes.message}]`;
        } catch (err) {
          toast.error("Failed to upload file");
        }
      }

      // 3. Send Message to AI
      const response = await aiApi.sendMessage(
        activeSessionId, 
        text + uploadedContext
      );

      // 4. Update Session State (New Chat Created?)
      if (!currentChatId && response.session_id) {
        setCurrentChatId(response.session_id);
        
        // ✅ NEW: Refresh cached sessions list since we added a new one
        refetchSessions();
        
        // ✅ NEW: Seed the cache for the new ID so it doesn't flicker empty
        // This prevents the UI from clearing when the ID switches from undefined -> new_id
        queryClient.setQueryData(["chat-history", response.session_id], [
           // Mock the API response structure to seed cache
           { role: "user", content: text },
           { role: "assistant", content: response.response }
        ]);
      }

      // 5. Add AI Response (Optimistic append preserved)
      const aiMsg: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: response.response,
      };
      setMessages((prev) => [...prev, aiMsg]);
      
      // ✅ NEW: Invalidate history cache so next fetch gets the server's version
      if (currentChatId) {
        queryClient.invalidateQueries({ queryKey: ["chat-history", currentChatId] });
      }

    } catch (error) {
      console.error(error);
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentChatId(undefined);
    setHistoryOpen(false);
  };

  const handleSelectChat = (id: string) => {
    if (id === currentChatId) return;
    setCurrentChatId(id);
    // Removed manual loadSessionMessages call; Query handles it automatically
    setHistoryOpen(false); 
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  return (
    <DashboardLayout>
      {/* Chat History Sidebar */}
      <ChatHistorySidebar
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        currentChatId={currentChatId}
        chats={sessions} // ✅ Uses cached sessions
      />

      {/* Mobile Sidebar */}
      <MobileSidebar 
        open={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
      />

      <div className="h-screen flex flex-col">
        {/* Header */}
        <header className="relative flex items-center justify-between px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex-shrink-0">
          <div className="flex items-center gap-2 z-10">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl bg-secondary/50 border border-border hover:bg-secondary transition-colors"
            >
              <List weight="regular" className="w-5 h-5 text-foreground" />
            </button>
            <Button
              variant="ghost"
              onClick={() => setHistoryOpen(true)}
              className="h-8 sm:h-9 gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            >
              <ChatCircle weight="regular" className="w-4 h-4" />
              <span className="text-sm hidden sm:inline">Chats</span>
            </Button>
          </div>

          {/* Centered Title */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2">
            <Lightning weight="fill" className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">TradeOmen AI</span>
          </div>

          <div className="w-10" />
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
          <AnimatePresence mode="wait">
            {!hasMessages ? (
              /* Empty State */
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center px-4"
              >
                <EmptyState />
                <ChatInput
                  onSend={handleSend}
                  isLoading={isLoading}
                  centered
                  onClearChat={handleClearChat}
                />
              </motion.div>
            ) : (
              /* Messages Layout */
              <motion.div
                key="messages"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col min-h-0"
              >
                {/* Scrollable Messages Area */}
                <ScrollArea className="flex-1" ref={scrollRef}>
                  <div className="max-w-3xl mx-auto px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
                    {messages.map((message) => (
                      <ChatMessage
                        key={message.id}
                        role={message.role}
                        content={message.content}
                        isStreaming={false} 
                      />
                    ))}

                    {/* Thinking Indicator */}
                    <AnimatePresence>
                      {isLoading && <ThinkingIndicator />}
                    </AnimatePresence>
                  </div>
                </ScrollArea>

                {/* Floating Input */}
                <div className="flex-shrink-0 pb-4 pt-2 bg-gradient-to-t from-background via-background to-transparent">
                  <ChatInput
                    onSend={handleSend}
                    isLoading={isLoading}
                    onClearChat={handleClearChat}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AIChat;