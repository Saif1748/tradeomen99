import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  PaperPlaneTilt,
  Microphone,
  FileText,
  MagnifyingGlass,
  ChartLine,
  Strategy,
  Trash,
  X,
  Image as ImageIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatInputProps {
  onSend: (message: string, attachments?: File[]) => void;
  isLoading?: boolean;
  centered?: boolean;
  onClearChat?: () => void;
  defaultValue?: string;
}

const contextChips = [
  { label: "My performance", icon: ChartLine },
  { label: "Risk analysis", icon: Strategy },
  { label: "Psychology feedback", icon: MagnifyingGlass },
  { label: "Strategy review", icon: FileText },
];

const ChatInput = ({ onSend, isLoading, centered, onClearChat, defaultValue = "" }: ChatInputProps) => {
  const [message, setMessage] = useState(defaultValue);
  const [files, setFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 200; // ~8 lines
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [message, files]);

  const handleSend = () => {
    if ((message.trim() || files.length > 0) && !isLoading) {
      onSend(message.trim(), files);
      setMessage("");
      setFiles([]);
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
  };

  const handleChipClick = (label: string) => {
    setMessage((prev) => (prev ? `${prev} ${label}` : label));
    textareaRef.current?.focus();
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (indexToRemove: number) => {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <motion.div
      layout
      className={`w-full max-w-3xl mx-auto ${centered ? "px-4" : "px-4 pb-4"}`}
    >
      <input
        type="file"
        multiple
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Context Chips - ONLY visible when centered (Empty State) AND no files attached */}
      {files.length === 0 && centered && (
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
      )}

      <div className="relative">
        <div className="flex flex-col p-2 rounded-[26px] bg-secondary/40 backdrop-blur-xl border border-border/30 focus-within:border-primary/30 transition-colors">
          
          <AnimatePresence>
            {files.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex gap-2 px-2 pt-2 pb-1 overflow-x-auto"
              >
                {files.map((file, index) => (
                  <motion.div
                    key={`${file.name}-${index}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative group flex items-center gap-2 px-3 py-2 bg-background/50 rounded-xl border border-border/50 shrink-0"
                  >
                    <div className="p-1.5 rounded-lg bg-secondary text-primary">
                      {file.type.startsWith("image/") ? (
                        <ImageIcon weight="fill" className="w-4 h-4" />
                      ) : (
                        <FileText weight="fill" className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex flex-col max-w-[120px]">
                      <span className="text-xs font-medium truncate">{file.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {(file.size / 1024).toFixed(0)}KB
                      </span>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute -top-1.5 -right-1.5 bg-background border border-border rounded-full p-0.5 text-muted-foreground hover:text-destructive transition-colors shadow-sm opacity-0 group-hover:opacity-100"
                    >
                      <X weight="bold" className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-end gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/60 flex-shrink-0 mb-0.5"
                >
                  <Plus weight="bold" className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={triggerFileUpload}>
                  <FileText weight="regular" className="w-4 h-4" />
                  Attach file
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <MagnifyingGlass weight="regular" className="w-4 h-4" />
                  Web search
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <ChartLine weight="regular" className="w-4 h-4" />
                  Analyze my trades
                </DropdownMenuItem>
                {onClearChat && (
                  <DropdownMenuItem
                    className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                    onClick={onClearChat}
                  >
                    <Trash weight="regular" className="w-4 h-4" />
                    Clear chat
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask TradeOmen anything..."
              rows={1}
              disabled={isLoading}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none py-2.5 px-1 max-h-[200px] leading-relaxed min-h-[40px]"
            />

            {!message && (
               <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/60 flex-shrink-0 mb-0.5"
              >
                <Microphone weight="regular" className="w-5 h-5" />
              </Button>
            )}

            <Button
              onClick={handleSend}
              disabled={(!message.trim() && files.length === 0) || isLoading}
              className={`h-9 w-9 rounded-full flex-shrink-0 mb-0.5 transition-all duration-200 ${
                message.trim() || files.length > 0 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90" 
                  : "bg-secondary text-muted-foreground cursor-not-allowed"
              }`}
              size="icon"
            >
              <PaperPlaneTilt weight="fill" className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground text-center mt-3">
        TradeOmen can make mistakes. Check important information.
      </p>
    </motion.div>
  );
};

export default ChatInput;