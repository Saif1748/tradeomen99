import React from "react";
import { motion } from "framer-motion";
import { Copy, ArrowsClockwise, Lightning } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

const ChatMessage = React.memo(({ role, content, isStreaming }: ChatMessageProps) => {
  const isUser = role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  };

  const handleRegenerate = () => {
    toast.info("Regenerating response...");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex gap-4 w-full ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* AI Avatar */}
      {!isUser ? (
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mt-1 shadow-sm">
          <Lightning weight="fill" className="w-[18px] h-[18px] text-primary" />
        </div>
      ) : (
        <div className="w-8 h-8 flex-shrink-0" /> /* Spacer for alignment */
      )}

      <div className={`flex flex-col gap-2 ${isUser ? "items-end" : "items-start"} max-w-[85%] sm:max-w-[75%]`}>
        {/* Message Content */}
        {isUser ? (
          <div className="bg-primary text-primary-foreground px-5 py-3.5 rounded-2xl rounded-tr-sm shadow-sm">
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{content}</p>
          </div>
        ) : (
          <div className="space-y-4 w-full pt-1.5 pb-2">
            <div className="text-[15px] text-foreground leading-loose whitespace-pre-wrap">
              {content}
              {isStreaming && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                  className="inline-block w-1.5 h-4 ml-1 bg-primary align-text-bottom rounded-full"
                />
              )}
            </div>

            {/* AI Actions */}
            {!isStreaming && (
              <div className="flex items-center gap-1 -ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-8 px-2.5 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg"
                >
                  <Copy weight="regular" className="w-4 h-4 mr-1.5" />
                  <span className="text-xs font-medium">Copy</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRegenerate}
                  className="h-8 px-2.5 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg"
                >
                  <ArrowsClockwise weight="regular" className="w-4 h-4 mr-1.5" />
                  <span className="text-xs font-medium">Regenerate</span>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Spacer for AI messages to keep them from hitting the right edge as much as users do left */}
      {!isUser && <div className="hidden sm:block w-8 h-8 flex-shrink-0" />}
    </motion.div>
  );
});

ChatMessage.displayName = "ChatMessage";

export default ChatMessage;
