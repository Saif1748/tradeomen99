import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatCircle, Lightning, List } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDashboard } from "@/components/dashboard/DashboardLayout"; // 1. Import hook
import ChatMessage from "@/components/ai-chat/ChatMessage";
import ChatInput from "@/components/ai-chat/ChatInput";
import ChatHistorySidebar from "@/components/ai-chat/ChatHistorySidebar";
import ThinkingIndicator from "@/components/ai-chat/ThinkingIndicator";
import EmptyState from "@/components/ai-chat/EmptyState";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  timestamp: string;
  preview: string;
  messages: Message[];
}

// Mock chat history
const mockChatHistory: ChatSession[] = [
  {
    id: "1",
    title: "AAPL Trade Analysis",
    timestamp: "2 hours ago",
    preview: "What was my win rate on AAPL trades last month?",
    messages: [],
  },
  {
    id: "2",
    title: "Risk Management Review",
    timestamp: "Yesterday",
    preview: "Can you analyze my position sizing?",
    messages: [],
  },
  {
    id: "3",
    title: "Strategy Performance",
    timestamp: "3 days ago",
    preview: "How is my momentum strategy performing?",
    messages: [],
  },
];

const AIChat = () => {
  // 2. Use global context for mobile menu
  const { onMobileMenuOpen } = useDashboard();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | undefined>();
  const [chatHistory] = useState<ChatSession[]>(mockChatHistory);
  // 3. Removed local mobileMenuOpen state and MobileSidebar
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const hasMessages = messages.length > 0;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const simulateAIResponse = (userMessage: string) => {
    setIsLoading(true);

    // Simulate thinking delay
    setTimeout(() => {
      setIsLoading(false);
      setIsStreaming(true);

      // Simulate streaming response
      const response = `Based on your trading data, here's what I found regarding "${userMessage}":\n\n**Key Insights:**\n- Your recent trades show a positive trend in risk management\n- Win rate has improved by 12% over the last month\n- Average position size aligns well with your account balance\n\n**Recommendations:**\n1. Consider scaling into positions gradually\n2. Your stop-loss placement has been effective\n3. The current strategy shows consistency\n\nWould you like me to dive deeper into any specific aspect?`;

      let currentIndex = 0;
      const assistantMessageId = Date.now().toString();

      // Add empty assistant message
      setMessages((prev) => [
        ...prev,
        { id: assistantMessageId, role: "assistant", content: "" },
      ]);

      // Stream characters
      const interval = setInterval(() => {
        currentIndex += 3;
        if (currentIndex >= response.length) {
          currentIndex = response.length;
          clearInterval(interval);
          setIsStreaming(false);
        }

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: response.slice(0, currentIndex) }
              : msg
          )
        );
      }, 15);
    }, 1000);
  };

  const handleSend = (message: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message,
    };
    setMessages((prev) => [...prev, userMessage]);
    simulateAIResponse(message);
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentChatId(undefined);
  };

  const handleSelectChat = (id: string) => {
    setCurrentChatId(id);
    // In a real app, load messages for this chat
    setMessages([]);
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  return (
    <>
      {/* Chat History Sidebar */}
      <ChatHistorySidebar
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        currentChatId={currentChatId}
        chats={chatHistory}
      />

      {/* 4. Removed local DashboardLayout and MobileSidebar wrappers */}

      <div className="h-screen flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex-shrink-0 border-b border-border/50">
          <div className="flex items-center gap-2">
            {/* Mobile menu button using global handler */}
            <button
              onClick={onMobileMenuOpen}
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

          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            <Lightning weight="fill" className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">TradeOmen AI</span>
          </div>

          {/* Empty div for spacing */}
          <div className="w-10" />
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
          <AnimatePresence mode="wait">
            {!hasMessages ? (
              /* Empty State - Centered Layout */
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
                    isLoading={isLoading || isStreaming}
                    onClearChat={handleClearChat}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

export default AIChat;