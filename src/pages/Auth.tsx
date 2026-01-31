import { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // Added useNavigate
import { motion } from "framer-motion";
import { toast } from "sonner"; // Added for notifications
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup 
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase"; // Import the firebase setup

import {
  Envelope,
  Lock,
  Eye,
  EyeSlash,
  ArrowRight,
  GoogleLogo,
  ChartLineUp,
  Brain,
  Lightning,
} from "@phosphor-icons/react";
import logo from "@/assets/tradeomen-logo.png";

const Auth = () => {
  const navigate = useNavigate(); // Hook for redirection
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // New loading state

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        // --- LOGIN LOGIC ---
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("Welcome back!");
        navigate("/dashboard");
      } else {
        // --- SIGN UP LOGIC ---
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success("Account created successfully!");
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error(error);
      // Clean up Firebase error messages for the user
      let message = "Authentication failed.";
      if (error.code === 'auth/invalid-credential') message = "Invalid email or password.";
      if (error.code === 'auth/email-already-in-use') message = "This email is already registered.";
      if (error.code === 'auth/weak-password') message = "Password should be at least 6 characters.";
      
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("Signed in with Google!");
      navigate("/dashboard");
    } catch (error: any) {
      console.error(error);
      toast.error("Google sign-in failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden">
        {/* Background gradients */}
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute inset-0 mesh-gradient" />
        
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link to="/">
              <img src={logo} alt="TradeOmen" className="h-12 w-auto mb-12" />
            </Link>
          </motion.div>

          {/* Tagline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl xl:text-4xl font-normal tracking-tight-premium leading-section text-foreground max-w-lg mb-6"
          >
            Transform your trading with intelligent{" "}
            <span className="text-gradient-primary font-medium">
              AI-powered insights
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg font-light text-muted-foreground max-w-md mb-16"
          >
            built for the future of trading
          </motion.p>

          {/* Feature Icons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative"
          >
            {/* Decorative circles and icons */}
            <div className="flex flex-wrap gap-8 xl:gap-12">
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <Brain weight="light" className="w-7 h-7 text-primary" />
                </div>
                <span className="text-sm font-light text-muted-foreground">
                  AI Analysis
                </span>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <ChartLineUp weight="light" className="w-7 h-7 text-primary" />
                </div>
                <span className="text-sm font-light text-muted-foreground">
                  Performance Tracking
                </span>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <Lightning weight="light" className="w-7 h-7 text-primary" />
                </div>
                <span className="text-sm font-light text-muted-foreground">
                  Real-time Sync
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Link to="/">
              <img src={logo} alt="TradeOmen" className="h-10 w-auto" />
            </Link>
          </div>

          {/* Auth Card */}
          <div className="glass-card p-8 sm:p-10 rounded-2xl">
            <h2 className="text-2xl font-normal tracking-tight-premium text-foreground mb-2">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-sm font-light text-muted-foreground mb-8">
              {isLogin
                ? "Sign in to unleash the power of AI in trading"
                : "Start your journey to smarter trading"}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div className="relative">
                <Envelope
                  weight="regular"
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground text-sm font-light focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <Lock
                  weight="regular"
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 pl-12 pr-12 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground text-sm font-light focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeSlash weight="regular" className="w-5 h-5" />
                  ) : (
                    <Eye weight="regular" className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Remember Me & Forgot Password */}
              {isLogin && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-border bg-secondary/50 text-primary focus:ring-primary/50"
                    />
                    <span className="text-sm font-light text-muted-foreground">
                      Remember me
                    </span>
                  </label>
                  <button
                    type="button"
                    className="text-sm font-light text-primary hover:underline"
                  >
                    Forgot your password?
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-xl glow-button text-primary-foreground text-sm font-normal flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  "Processing..."
                ) : (
                  <>
                    {isLogin ? "Sign in" : "Create account"}
                    <ArrowRight weight="bold" className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 text-xs font-light text-muted-foreground bg-card">
                  or
                </span>
              </div>
            </div>

            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-card border border-border text-foreground text-sm font-normal flex items-center justify-center gap-3 hover:bg-secondary/50 transition-colors disabled:opacity-50"
            >
              <GoogleLogo weight="bold" className="w-5 h-5" />
              Sign in with Google
            </button>

            {/* Toggle Auth Mode */}
            <p className="text-center text-sm font-light text-muted-foreground mt-8">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline font-normal"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>

          {/* Terms */}
          <p className="text-center text-xs font-light text-muted-foreground mt-6 px-4">
            By continuing, you agree to our{" "}
            <Link to="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;