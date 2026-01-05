import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatCircle, Lightning, List } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ChatMessage from "@/components/ai-chat/ChatMessage";
import ChatInput from "@/components/ai-chat/ChatInput";
import ChatHistorySidebar from "@/components/ai-chat/ChatHistorySidebar";
import ThinkingIndicator from "@/components/ai-chat/ThinkingIndicator";
import EmptyState from "@/components/ai-chat/EmptyState";
import MobileSidebar from "@/components/dashboard/MobileSidebar";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: File[];
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | undefined>();
  const [chatHistory] = useState<ChatSession[]>(mockChatHistory);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const handleSend = (message: string, attachments?: File[]) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      attachments: attachments
    };
    setMessages((prev) => [...prev, userMessage]);
    
    // If there are attachments, we might want to modify the AI response logic here
    // For now, we just pass the text to the simulator
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
    <DashboardLayout>
      {/* Chat History Sidebar */}
      <ChatHistorySidebar
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        currentChatId={currentChatId}
        chats={chatHistory}
      />

      {/* Mobile Sidebar */}
      <MobileSidebar 
        open={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
      />

      <div className="h-screen flex flex-col">
        {/* Header - Updated for centering and no border */}
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

          {/* Empty div for spacing to balance the layout */}
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
                        // Pass attachments to ChatMessage if you updated that component to support them
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
    </DashboardLayout>
  );
};

export default AIChat;