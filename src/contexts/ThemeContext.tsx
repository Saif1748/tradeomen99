import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type ThemeMode = "light" | "dark" | "system";
export type ThemePreset = "cyan" | "blue" | "purple" | "orange" | "green" | "red";
export type ThemeFont = "Public Sans" | "Inter" | "DM Sans" | "Nunito Sans";

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  preset: ThemePreset;
  setPreset: (preset: ThemePreset) => void;
  font: ThemeFont;
  setFont: (font: ThemeFont) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  resolvedMode: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const presetColors: Record<ThemePreset, { main: string; lightBg: string; ring: string }> = {
  cyan:   { main: "199 92% 69%", lightBg: "209 94% 48%", ring: "199 92% 69%" },
  blue:   { main: "217 91% 60%", lightBg: "217 91% 48%", ring: "217 91% 60%" },
  purple: { main: "262 83% 58%", lightBg: "262 83% 48%", ring: "262 83% 58%" },
  orange: { main: "25 95% 53%",  lightBg: "25 95% 48%",  ring: "25 95% 53%" },
  green:  { main: "142 71% 45%", lightBg: "142 71% 38%", ring: "142 71% 45%" },
  red:    { main: "0 84% 60%",   lightBg: "0 84% 48%",   ring: "0 84% 60%" },
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => (localStorage.getItem("theme-mode") as ThemeMode) || "dark");
  const [preset, setPreset] = useState<ThemePreset>(() => (localStorage.getItem("theme-preset") as ThemePreset) || "cyan");
  const [font, setFont] = useState<ThemeFont>(() => (localStorage.getItem("theme-font") as ThemeFont) || "Public Sans");
  const [fontSize, setFontSize] = useState<number>(() => Number(localStorage.getItem("theme-font-size")) || 16);
  const [systemDark, setSystemDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const resolvedMode = mode === "system" ? (systemDark ? "dark" : "light") : mode;

  useEffect(() => { localStorage.setItem("theme-mode", mode); }, [mode]);
  useEffect(() => { localStorage.setItem("theme-preset", preset); }, [preset]);
  useEffect(() => { localStorage.setItem("theme-font", font); }, [font]);
  useEffect(() => { localStorage.setItem("theme-font-size", String(fontSize)); }, [fontSize]);

  // Apply theme class
  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolvedMode === "dark");
    document.documentElement.classList.toggle("light", resolvedMode === "light");
  }, [resolvedMode]);

  // Apply preset colors as CSS variables
  useEffect(() => {
    const colors = presetColors[preset];
    const root = document.documentElement;
    root.style.setProperty("--primary", colors.main);
    root.style.setProperty("--ring", colors.ring);
    root.style.setProperty("--sidebar-primary", colors.main);
    root.style.setProperty("--sidebar-accent-foreground", colors.main);
    root.style.setProperty("--sidebar-ring", colors.ring);
    // light bg variant
    root.style.setProperty("--primary-light-bg", colors.lightBg + " / 0.08");
    root.style.setProperty("--sidebar-accent", colors.lightBg + " / 0.08");
  }, [preset]);

  // Apply font
  useEffect(() => {
    document.documentElement.style.setProperty("--font-family", `'${font}', sans-serif`);
  }, [font]);

  // Apply font size
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
  }, [fontSize]);

  return (
    <ThemeContext.Provider value={{ mode, setMode, preset, setPreset, font, setFont, fontSize, setFontSize, resolvedMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
