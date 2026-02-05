import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { sendEmailVerification, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { EnvelopeOpen, ArrowRight, SignOut } from "@phosphor-icons/react";
import { toast } from "sonner";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [cooldown, setCooldown] = useState(0); // 3. Cooldown Logic
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setUserEmail(user.email || "");
      // If already verified, kick them to dashboard
      if (user.emailVerified) {
        navigate("/dashboard");
      }
    } else {
      navigate("/auth");
    }
  }, [navigate]);

  // Cooldown Timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => setCooldown(c => c - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0) return;
    
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        toast.success("Verification email sent!");
        setCooldown(60); // 60s standard industry cooldown
      }
    } catch (error) {
      toast.error("Too many requests. Please wait.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/auth");
  };

  // Check status button (Manual polling)
  const handleCheckStatus = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        toast.success("Email verified!");
        navigate("/dashboard");
      } else {
        toast.info("Not verified yet. Check your inbox.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass-card p-8 rounded-2xl text-center"
      >
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <EnvelopeOpen weight="duotone" className="w-8 h-8 text-primary" />
        </div>
        
        <h1 className="text-2xl font-semibold mb-2">Verify your email</h1>
        <p className="text-muted-foreground mb-6">
          We sent a verification link to <span className="font-medium text-foreground">{userEmail}</span>. 
          Please check your inbox (and spam) to unlock your account.
        </p>

        <div className="space-y-3">
          <button 
            onClick={handleCheckStatus}
            className="w-full h-11 rounded-xl glow-button text-primary-foreground font-medium flex items-center justify-center gap-2"
          >
            I've verified my email <ArrowRight weight="bold" />
          </button>

          <button 
            onClick={handleResend}
            disabled={cooldown > 0}
            className="w-full h-11 rounded-xl border border-border hover:bg-secondary/50 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Verification Email"}
          </button>
        </div>

        <button 
          onClick={handleLogout}
          className="mt-8 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mx-auto"
        >
          <SignOut /> Sign out or change email
        </button>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;