 import { useState } from "react";
 import { NavLink, useLocation } from "react-router-dom";
 import { motion } from "framer-motion";
 import { MagnifyingGlass, Bell, Command, CaretDown, Sun, Moon, CurrencyDollar } from "@phosphor-icons/react";
 import { useTheme } from "next-themes";
 import logoFull from "@/assets/logo-full.png";
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
 } from "@/components/ui/dropdown-menu";
 import { Avatar, AvatarFallback } from "@/components/ui/avatar";
 
 const currencies = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD"];
 
 const routeTitles: Record<string, string> = {
   "/dashboard": "Dashboard",
   "/trades": "Trades",
   "/strategies": "Strategies",
   "/calendar": "Calendar",
   "/ai-chat": "AI Chat",
 };
 
 interface GlobalHeaderProps {
   onOpenSettings: () => void;
 }
 
 export const GlobalHeader = ({ onOpenSettings }: GlobalHeaderProps) => {
   const location = useLocation();
   const pageTitle = routeTitles[location.pathname] || "Dashboard";
   const { theme, setTheme } = useTheme();
   const [selectedCurrency, setSelectedCurrency] = useState("USD");
 
   return (
     <header className="fixed top-0 left-0 right-0 z-50 h-16">
       {/* Gradient background layer */}
       <div className="absolute inset-0 bg-gradient-to-r from-card via-card/95 to-card" />
       
       {/* Glassmorphism overlay */}
       <div className="absolute inset-0 backdrop-blur-2xl bg-background/40" />
       
       {/* Accent glow effects */}
       <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute -top-20 left-1/4 w-96 h-40 bg-primary/10 rounded-full blur-3xl" />
         <div className="absolute -top-20 right-1/3 w-64 h-32 bg-glow-secondary/10 rounded-full blur-3xl" />
       </div>
       
       {/* Bottom border with gradient */}
       <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
       
       {/* Content */}
       <div className="relative h-full px-6 flex items-center justify-between">
         {/* Left Section - Logo */}
         <div className="flex items-center gap-8">
           <NavLink to="/dashboard" className="group relative flex items-center">
             <motion.div
               whileHover={{ scale: 1.02 }}
               transition={{ duration: 0.2 }}
               className="relative"
             >
               {/* Logo glow on hover */}
               <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 to-glow-secondary/20 rounded-xl opacity-0 group-hover:opacity-100 blur-lg transition-opacity duration-300" />
               <img
                 src={logoFull}
                 alt="TradeOmen"
                 className="relative h-8 w-auto"
               />
             </motion.div>
           </NavLink>
           
           {/* Vertical divider */}
           <div className="hidden md:block h-6 w-px bg-gradient-to-b from-transparent via-border to-transparent" />
           
           {/* Page Title */}
           <motion.div
             key={pageTitle}
             initial={{ opacity: 0, y: -10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.2 }}
             className="hidden md:block"
           >
             <span className="text-sm font-light text-muted-foreground">{pageTitle}</span>
           </motion.div>
         </div>
 
         {/* Right Section - Actions */}
           <div className="flex items-center gap-1.5">
             {/* Currency Selector */}
             <DropdownMenu>
               <DropdownMenuTrigger asChild>
                 <motion.button
                   whileHover={{ scale: 1.02 }}
                   whileTap={{ scale: 0.98 }}
                   className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-secondary/30 hover:bg-secondary/60 border border-border/30 hover:border-primary/30 transition-all duration-200 group"
                 >
                   <CurrencyDollar weight="light" className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                   <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{selectedCurrency}</span>
                   <CaretDown weight="bold" className="w-3 h-3 text-muted-foreground" />
                 </motion.button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end" className="min-w-[100px] bg-card/95 backdrop-blur-xl border-border/50">
                 {currencies.map((currency) => (
                   <DropdownMenuItem
                     key={currency}
                     onClick={() => setSelectedCurrency(currency)}
                     className={`cursor-pointer ${selectedCurrency === currency ? "bg-primary/10 text-primary" : "hover:bg-primary/10 focus:bg-primary/10"}`}
                   >
                     {currency}
                   </DropdownMenuItem>
                 ))}
               </DropdownMenuContent>
             </DropdownMenu>
 
             {/* Theme Toggle */}
             <motion.button
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
               className="relative p-2.5 rounded-xl bg-secondary/30 hover:bg-secondary/60 border border-border/30 hover:border-primary/30 transition-all duration-200 group"
             >
               {theme === "dark" ? (
                 <Sun weight="light" className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
               ) : (
                 <Moon weight="light" className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
               )}
             </motion.button>
 
           {/* Search Button */}
           <motion.button
             whileHover={{ scale: 1.02 }}
             whileTap={{ scale: 0.98 }}
             className="group relative flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/50 hover:bg-secondary/80 border border-border/50 hover:border-primary/30 transition-all duration-200"
           >
             <MagnifyingGlass weight="light" className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
             <span className="hidden sm:block text-sm text-muted-foreground group-hover:text-foreground transition-colors">Search...</span>
             <div className="hidden sm:flex items-center gap-0.5 ml-2">
               <kbd className="flex items-center justify-center h-5 px-1.5 rounded bg-background/80 border border-border/80 text-[10px] text-muted-foreground">
                 <Command weight="bold" className="w-2.5 h-2.5" />
               </kbd>
               <kbd className="flex items-center justify-center h-5 px-1.5 rounded bg-background/80 border border-border/80 text-[10px] text-muted-foreground">
                 K
               </kbd>
             </div>
           </motion.button>
 
           {/* Notifications */}
           <motion.button
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
               className="hidden sm:flex relative p-2.5 rounded-xl bg-secondary/30 hover:bg-secondary/60 border border-border/30 hover:border-primary/30 transition-all duration-200 group"
           >
             <Bell weight="light" className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
             {/* Notification badge */}
             <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary animate-pulse" />
           </motion.button>
 
           {/* Divider */}
             <div className="hidden sm:block h-6 w-px bg-border/50 mx-1" />
 
           {/* User Dropdown */}
           <DropdownMenu>
             <DropdownMenuTrigger asChild>
               <motion.button
                 whileHover={{ scale: 1.02 }}
                 className="flex items-center gap-3 p-1.5 pr-3 rounded-xl bg-secondary/30 hover:bg-secondary/60 border border-border/30 hover:border-primary/30 transition-all duration-200 group"
               >
                 <Avatar className="h-8 w-8 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                   <AvatarFallback className="bg-gradient-to-br from-primary to-glow-secondary text-primary-foreground text-xs font-medium">
                     JD
                   </AvatarFallback>
                 </Avatar>
                 <div className="hidden sm:flex flex-col items-start">
                   <span className="text-sm font-normal text-foreground">John Doe</span>
                   <span className="text-[10px] text-primary font-light">Pro Plan</span>
                 </div>
                 <CaretDown weight="bold" className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
               </motion.button>
             </DropdownMenuTrigger>
             <DropdownMenuContent align="end" className="w-56 bg-card/95 backdrop-blur-xl border-border/50">
               <DropdownMenuLabel className="font-normal">
                 <div className="flex flex-col space-y-1">
                   <p className="text-sm font-medium">John Doe</p>
                   <p className="text-xs text-muted-foreground">john@example.com</p>
                 </div>
               </DropdownMenuLabel>
               <DropdownMenuSeparator className="bg-border/50" />
               <DropdownMenuItem 
                 onClick={onOpenSettings}
                 className="cursor-pointer hover:bg-primary/10 focus:bg-primary/10"
               >
                 Settings
               </DropdownMenuItem>
               <DropdownMenuItem className="cursor-pointer hover:bg-primary/10 focus:bg-primary/10">
                 Billing
               </DropdownMenuItem>
               <DropdownMenuSeparator className="bg-border/50" />
               <DropdownMenuItem className="cursor-pointer text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive">
                 Sign out
               </DropdownMenuItem>
             </DropdownMenuContent>
           </DropdownMenu>
         </div>
       </div>
     </header>
   );
 };