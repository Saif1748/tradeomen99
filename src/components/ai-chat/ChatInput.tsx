import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  PaperPlaneTilt,
  Microphone,
  FileText,
  MagnifyingGlass,
  ChartLine,
  Strategy,
  Trash,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  centered?: boolean;
  onClearChat?: () => void;
}

const contextChips = [
  { label: "My performance", icon: ChartLine },
  { label: "Risk analysis", icon: Strategy },
  { label: "Psychology feedback", icon: MagnifyingGlass },
  { label: "Strategy review", icon: FileText },
];

const ChatInput = ({ onSend, isLoading, centered, onClearChat }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 200; // ~8 lines
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [message]);

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSend(message.trim());
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChipClick = (label: string) => {
    setMessage((prev) => (prev ? `${prev} ${label}` : label));
    textareaRef.current?.focus();
  };

  return (
    <motion.div
      layout
      className={`w-full max-w-3xl mx-auto ${centered ? "px-4" : "px-4 pb-4"}`}
    >
      {/* Context Chips */}
      <div className="flex flex-wrap gap-2 mb-3 justify-center">
        {contextChips.map((chip) => {
          const Icon = chip.icon;
          return (
            <button
              key={chip.label}
              onClick={() => handleChipClick(chip.label)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-normal text-muted-foreground border border-border/50 bg-secondary/30 hover:bg-secondary/60 hover:text-foreground hover:border-border transition-all duration-200"
            >
              <Icon weight="regular" className="w-3.5 h-3.5" />
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Input Container */}
      <div className="relative">
        <div className="flex items-end gap-2 p-2 rounded-[28px] bg-secondary/40 backdrop-blur-xl border border-border/30 focus-within:border-primary/30 transition-colors">
          {/* Plus Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/60 flex-shrink-0"
              >
                <Plus weight="bold" className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem className="gap-2">
                <FileText weight="regular" className="w-4 h-4" />
                Attach file
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <MagnifyingGlass weight="regular" className="w-4 h-4" />
                Web search
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <ChartLine weight="regular" className="w-4 h-4" />
                Analyze my trades
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <Strategy weight="regular" className="w-4 h-4" />
                Strategy review
              </DropdownMenuItem>
              {onClearChat && (
                <DropdownMenuItem
                  className="gap-2 text-destructive focus:text-destructive"
                  onClick={onClearChat}
                >
                  <Trash weight="regular" className="w-4 h-4" />
                  Clear chat
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask TradeOmen anything..."
            rows={1}
            disabled={isLoading}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none py-2 px-1 max-h-[200px] leading-relaxed"
          />

          {/* Microphone */}
          <Button
            variant="ghost"
            size="icon"
            disabled={!!message}
            className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/60 flex-shrink-0 disabled:opacity-30"
          >
            <Microphone weight="regular" className="w-5 h-5" />
          </Button>

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={!message.trim() || isLoading}
            className="h-9 w-9 rounded-full glow-button flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            size="icon"
          >
            <PaperPlaneTilt weight="fill" className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-[11px] text-muted-foreground text-center mt-3">
        TradeOmen can make mistakes. Check important information.
      </p>
    </motion.div>
  );
};

export default ChatInput;
