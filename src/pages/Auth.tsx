import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { z } from "zod"; 
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup,
  updateProfile,
  sendEmailVerification, 
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { syncUserWithFirestore } from "@/services/userService";

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
  User,
} from "@phosphor-icons/react";
import logo from "@/assets/tradeomen-logo.png";

// --- Validation Schemas ---
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const signupSchema = z.object({
  firstName: z.string().min(2, "First name is too short"),
  lastName: z.string().min(2, "Last name is too short"),
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
});

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Unified Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // --- Password Reset Logic ---
  const handleForgotPassword = async () => {
    if (!formData.email) {
      toast.error("Please enter your email address first.");
      return;
    }

    try {
      setIsLoading(true);
      await sendPasswordResetEmail(auth, formData.email);
      // ✅ Best Practice: Do not reveal if the email exists or not
      toast.success("If an account exists, a reset link has been sent.");
    } catch (error: any) {
      console.error(error);
      // Only show specific errors for rate limiting or invalid format
      if (error.code === 'auth/invalid-email') {
        toast.error("Invalid email address format.");
      } else if (error.code === 'auth/too-many-requests') {
        toast.error("Too many attempts. Please try again later.");
      } else {
        // Fallback for user-not-found or other errors to maintain ambiguity
        toast.success("If an account exists, a reset link has been sent.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- Main Auth Logic ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        // === LOGIN FLOW ===
        const data = loginSchema.parse({
          email: formData.email, 
          password: formData.password
        });

        const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
        
        // Sync & Redirect
        if (userCredential.user) {
          await syncUserWithFirestore(userCredential.user);
          
          if (!userCredential.user.emailVerified) {
             // ℹ️ Informational toast, but we handle enforcement in ProtectedRoute
            toast("Please verify your email to access all features.", { icon: "📧" });
          } else {
            toast.success("Welcome back!");
          }
          
          navigate("/dashboard");
        }

      } else {
        // === SIGN UP FLOW ===
        const data = signupSchema.parse(formData);

        // 1. Create Account
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);

        // 2. Update Profile (Display Name)
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, {
            displayName: `${data.firstName} ${data.lastName}`.trim()
          });
          
          // 3. Send Verification Email
          await sendEmailVerification(auth.currentUser);
          
          // Force reload to apply changes locally
          await auth.currentUser.reload();
        }

        // 4. Sync User to Firestore
        const userToSync = auth.currentUser || userCredential.user;
        await syncUserWithFirestore(userToSync);

        toast.success("Account created! Please check your inbox to verify.");
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error(error);
      
      // Handle Zod Validation Errors
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        // 🔐 Security: Anti-Enumeration Error Handling
        const code = error.code;
        let message = "Authentication failed.";

        // Group all "User/Password" errors into one generic message
        const ambiguousErrors = [
          'auth/invalid-credential',
          'auth/user-not-found',
          'auth/wrong-password',
        ];

        if (ambiguousErrors.includes(code)) {
          message = "Invalid email or password.";
        } 
        // Specific handling for non-credential errors
        else if (code === 'auth/email-already-in-use') {
          message = "This email is already registered.";
        } 
        else if (code === 'auth/too-many-requests') {
          message = "Account temporarily locked due to failed attempts. Try later.";
        }
        else if (code === 'auth/network-request-failed') {
          message = "Network error. Please check your connection.";
        }
        
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      
      if (result.user) {
        await syncUserWithFirestore(result.user);
      }

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
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute inset-0 mesh-gradient" />
        
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link to="/">
              <img src={logo} alt="TradeOmen" className="h-12 w-auto mb-12" />
            </Link>
          </motion.div>

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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative"
          >
            <div className="flex flex-wrap gap-8 xl:gap-12">
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <Brain weight="light" className="w-7 h-7 text-primary" />
                </div>
                <span className="text-sm font-light text-muted-foreground">AI Analysis</span>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <ChartLineUp weight="light" className="w-7 h-7 text-primary" />
                </div>
                <span className="text-sm font-light text-muted-foreground">Performance Tracking</span>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <Lightning weight="light" className="w-7 h-7 text-primary" />
                </div>
                <span className="text-sm font-light text-muted-foreground">Real-time Sync</span>
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

          <div className="glass-card p-8 sm:p-10 rounded-2xl">
            <h2 className="text-2xl font-normal tracking-tight-premium text-foreground mb-2">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-sm font-light text-muted-foreground mb-8">
              {isLogin
                ? "Sign in to unleash the power of AI in trading"
                : "Join the future of trading intelligence"}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Name Fields - Slide in animation */}
              <AnimatePresence>
                {!isLogin && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="grid grid-cols-2 gap-4 overflow-hidden"
                  >
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="First Name"
                        value={formData.firstName}
                        onChange={(e) => handleChange("firstName", e.target.value)}
                        className="w-full h-12 pl-12 pr-4 rounded-xl bg-secondary/50 border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div className="relative">
                       <input
                        type="text"
                        placeholder="Last Name"
                        value={formData.lastName}
                        onChange={(e) => handleChange("lastName", e.target.value)}
                        className="w-full h-12 px-4 rounded-xl bg-secondary/50 border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email Input */}
              <div className="relative">
                <Envelope weight="regular" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="w-full h-12 pl-12 pr-4 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground text-sm font-light focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <Lock weight="regular" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={isLogin ? "Password" : "Password (Min 8 chars)"}
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  className="w-full h-12 pl-12 pr-12 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground text-sm font-light focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeSlash className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Forgot Password Logic */}
              {isLogin && (
                <div className="flex justify-end">
                  <button 
                    type="button" 
                    onClick={handleForgotPassword}
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

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center"><span className="px-4 text-xs font-light text-muted-foreground bg-card">or</span></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-card border border-border text-foreground text-sm font-normal flex items-center justify-center gap-3 hover:bg-secondary/50 transition-colors disabled:opacity-50"
            >
              <GoogleLogo weight="bold" className="w-5 h-5" />
              Sign in with Google
            </button>

            <p className="text-center text-sm font-light text-muted-foreground mt-8">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setFormData(prev => ({ ...prev, password: "" })); 
                }}
                className="text-primary hover:underline font-normal"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>

          <p className="text-center text-xs font-light text-muted-foreground mt-6 px-4">
            By continuing, you agree to our <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;