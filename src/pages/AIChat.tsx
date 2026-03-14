import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatCircle, Lightning, List } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDashboard } from "@/components/dashboard/DashboardLayout";
import ChatMessage from "@/components/ai-chat/ChatMessage";
import ChatInput from "@/components/ai-chat/ChatInput";
import ChatHistorySidebar from "@/components/ai-chat/ChatHistorySidebar";
import ThinkingIndicator from "@/components/ai-chat/ThinkingIndicator";
import EmptyState from "@/components/ai-chat/EmptyState";
import { useAIChat } from "@/hooks/useAIChat";

const AIChat = () => {
  const { onMobileMenuOpen } = useDashboard();
  const {
    messages,
    isLoading,
    isStreaming,
    historyOpen,
    currentChatId,
    chatHistory,
    handleSend,
    handleNewChat,
    handleSelectChat,
    handleClearChat,
    handleSetHistoryOpen,
  } = useAIChat();
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const hasMessages = messages.length > 0;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <>
      {/* Chat History Sidebar */}
      <ChatHistorySidebar
        isOpen={historyOpen}
        onClose={() => handleSetHistoryOpen(false)}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        currentChatId={currentChatId}
        chats={chatHistory}
      />

      <div className="h-screen flex flex-col bg-background">
        {/* Clean Minimalist Header */}
        <header className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={onMobileMenuOpen}
              className="md:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            >
              <List weight="regular" className="w-5 h-5" />
            </button>
            <Button
              variant="ghost"
              onClick={() => handleSetHistoryOpen(true)}
              className="h-8 sm:h-9 gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-full"
            >
              <ChatCircle weight="regular" className="w-4 h-4" />
              <span className="text-sm hidden sm:inline">Chats</span>
            </Button>
          </div>

          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            <Lightning weight="fill" className="w-4 h-4 text-foreground/80" />
            <span className="text-sm font-medium text-foreground tracking-tight">TradeOmen AI</span>
          </div>

          <div className="w-10" />
        </header>

        {/* Main Content Area - Centered and max-width restricted */}
        <div className="flex-1 flex flex-col min-h-0 items-center w-full">
          <div className="w-full max-w-3xl flex-1 flex flex-col min-h-0 relative">
            <AnimatePresence mode="wait">
              {!hasMessages ? (
                /* Empty State */
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center px-4 w-full"
                >
                  <EmptyState />
                  <div className="w-full mt-8">
                    <ChatInput
                      onSend={handleSend}
                      isLoading={isLoading}
                      centered
                      onClearChat={handleClearChat}
                    />
                  </div>
                </motion.div>
              ) : (
                /* Messages Layout */
                <motion.div
                  key="messages"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 flex flex-col min-h-0 w-full relative"
                >
                  <ScrollArea className="flex-1 w-full" ref={scrollRef}>
                    <div className="w-full px-4 py-4 sm:py-6 space-y-6">
                      {messages.map((message, index) => (
                        <ChatMessage
                          key={message.id}
                          role={message.role}
                          content={message.content}
                          isStreaming={
                            isStreaming &&
                            index === messages.length - 1 &&
                            message.role === "assistant"
                          }
                        />
                      ))}

                      <AnimatePresence>
                        {isLoading && <ThinkingIndicator />}
                      </AnimatePresence>
                    </div>
                  </ScrollArea>

                  {/* Floating Input aligned to bottom */}
                  <div className="flex-shrink-0 pb-4 pt-2 bg-gradient-to-t from-background via-background to-transparent w-full">
                    <ChatInput
                      onSend={handleSend}
                      isLoading={isLoading || isStreaming}
                      onClearChat={handleClearChat}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
};

export default AIChat;