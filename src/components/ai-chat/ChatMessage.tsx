import { motion } from "framer-motion";
import { Copy, ArrowsClockwise, Lightning } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

const ChatMessage = ({ role, content, isStreaming }: ChatMessageProps) => {
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
      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {/* AI Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-glow-primary to-glow-secondary flex items-center justify-center">
          <Lightning weight="fill" className="w-4 h-4 text-primary-foreground" />
        </div>
      )}

      <div className={`flex flex-col gap-2 ${isUser ? "items-end" : "items-start"} max-w-[85%] sm:max-w-[75%]`}>
        {/* Message Content */}
        {isUser ? (
          <div className="glass-card px-4 py-3 rounded-2xl rounded-tr-md">
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{content}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {content}
              {isStreaming && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                  className="inline-block w-1.5 h-4 ml-0.5 bg-primary align-text-bottom"
                />
              )}
            </p>

            {/* AI Actions */}
            {!isStreaming && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-7 px-2 text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                >
                  <Copy weight="regular" className="w-3.5 h-3.5 mr-1" />
                  <span className="text-xs">Copy</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRegenerate}
                  className="h-7 px-2 text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                >
                  <ArrowsClockwise weight="regular" className="w-3.5 h-3.5 mr-1" />
                  <span className="text-xs">Regenerate</span>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Avatar Placeholder (invisible for spacing) */}
      {isUser && <div className="w-8 h-8 flex-shrink-0" />}
    </motion.div>
  );
};

export default ChatMessage;
