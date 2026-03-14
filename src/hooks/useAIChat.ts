import { useState, useCallback } from "react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface ChatSession {
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

/**
 * Custom hook managing the state and logic for the AI Chat interface.
 * Implements performance optimizations using useCallback for referential stability.
 */
export const useAIChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | undefined>();
  const [chatHistory] = useState<ChatSession[]>(mockChatHistory);

  /**
   * Simulates a streaming AI response.
   * @param userMessage - The message sent by the user.
   */
  const simulateAIResponse = useCallback((userMessage: string) => {
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
  }, []);

  /**
   * Handles sending a new message from the user.
   * @param message - The text content of the user's message.
   */
  const handleSend = useCallback((message: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message,
    };
    setMessages((prev) => [...prev, userMessage]);
    simulateAIResponse(message);
  }, [simulateAIResponse]);

  /**
   * Clears the current chat messages and deselects the chat session.
   */
  const handleNewChat = useCallback(() => {
    setMessages([]);
    setCurrentChatId(undefined);
  }, []);

  /**
   * Selects an existing chat session from history.
   * @param id - The ID of the chat session to select.
   */
  const handleSelectChat = useCallback((id: string) => {
    setCurrentChatId(id);
    // In a real app, load messages for this chat
    setMessages([]);
  }, []);

  /**
   * Clears all messages in the current chat view.
   */
  const handleClearChat = useCallback(() => {
    setMessages([]);
  }, []);

  /**
   * Toggles or sets the visibility state of the chat history sidebar.
   * @param isOpen - Boolean indicating if history should be open. If undefined, toggles the current state.
   */
  const handleSetHistoryOpen = useCallback((isOpen?: boolean) => {
    setHistoryOpen((prev) => (isOpen !== undefined ? isOpen : !prev));
  }, []);

  return {
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
  };
};
