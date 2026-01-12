import React, { createContext, useContext, useState, ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Crown } from "lucide-react";

interface ModalContextType {
  openUpgradeModal: (message?: string) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("Upgrade your plan to unlock unlimited access.");
  const navigate = useNavigate();

  const openUpgradeModal = (msg?: string) => {
    if (msg) setMessage(msg);
    setIsOpen(true);
  };

  const closeModal = () => setIsOpen(false);

  const handleUpgrade = () => {
    setIsOpen(false);
    navigate("/pricing");
  };

  return (
    <ModalContext.Provider value={{ openUpgradeModal, closeModal }}>
      {children}
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-500/10 rounded-full">
                <Crown className="w-5 h-5 text-amber-500" />
              </div>
              <DialogTitle>Upgrade Plan</DialogTitle>
            </div>
            <DialogDescription className="pt-2 text-foreground/80">
              {message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-start gap-2 pt-4">
            <Button 
              onClick={handleUpgrade} 
              className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg shadow-amber-500/20"
            >
              View Plans
            </Button>
            <Button variant="ghost" onClick={closeModal} className="w-full sm:w-auto">
              Maybe Later
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModalContext.Provider>
  );
};