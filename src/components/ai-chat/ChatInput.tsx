import React, { useState, useRef, useEffect, KeyboardEvent } from "react";
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

const ChatInput = React.memo(({ onSend, isLoading, centered, onClearChat }: ChatInputProps) => {
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
    // Submit on Enter without shift
    if (e.key === "Enter" && !e.shiftKey) {
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
      className={`w-full mx-auto ${centered ? "px-4" : "px-4 pb-4"}`}
    >
      {/* Context Chips - Cleaner look */}
      <div className="flex flex-wrap gap-2 mb-4 justify-center">
        {contextChips.map((chip) => {
          const Icon = chip.icon;
          return (
            <button
              key={chip.label}
              onClick={() => handleChipClick(chip.label)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-muted-foreground bg-secondary/40 border border-border hover:bg-secondary hover:text-foreground transition-all duration-200"
            >
              <Icon weight="regular" className="w-[14px] h-[14px]" />
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Input Container - Clean pill style matching site aesthetics */}
      <div className="relative max-w-3xl mx-auto shadow-sm">
        <div className="flex items-end gap-2 p-2 rounded-2xl bg-secondary/40 border border-border focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
          {/* Plus Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-background flex-shrink-0"
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
            className="flex-1 bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground resize-none focus:outline-none py-2.5 px-2 max-h-[200px] leading-relaxed"
          />

          {/* Microphone */}
          <Button
            variant="ghost"
            size="icon"
            disabled={!!message}
            className="h-10 w-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-background flex-shrink-0 disabled:opacity-30 mb-0.5"
          >
            <Microphone weight="regular" className="w-5 h-5" />
          </Button>

          <Button
            onClick={handleSend}
            disabled={!message.trim() || isLoading}
            className={`h-10 w-10 rounded-xl flex-shrink-0 transition-colors mb-0.5 ${
              message.trim() && !isLoading
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
            size="icon"
          >
            <PaperPlaneTilt weight="fill" className="w-[18px] h-[18px]" />
          </Button>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground text-center mt-3 font-medium">
        TradeOmen can make mistakes. Check important information.
      </p>
    </motion.div>
  );
});

ChatInput.displayName = "ChatInput";

export default ChatInput;
