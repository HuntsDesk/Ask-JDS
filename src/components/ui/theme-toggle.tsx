import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ThemeToggleProps {
  variant?: "icon" | "switch";
  className?: string;
}

export function ThemeToggle({
  variant = "icon",
  className = "",
}: ThemeToggleProps) {
  const [theme, setThemeState] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setThemeState(isDark ? "dark" : "light");
  }, []);

  useEffect(() => {
    const handleThemeChange = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setThemeState(isDark ? "dark" : "light");
    };

    // Listen for theme changes from other components
    window.addEventListener("themeChange", handleThemeChange);
    return () => window.removeEventListener("themeChange", handleThemeChange);
  }, []);

  const setTheme = (newTheme: "light" | "dark") => {
    setThemeState(newTheme);
    
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
    
    // Dispatch an event so other components can react to theme changes
    window.dispatchEvent(new Event("themeChange"));
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  if (theme === null) {
    return null; // Avoid flash of incorrect theme
  }

  if (variant === "switch") {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Label htmlFor="theme-toggle" className="cursor-pointer">
          <div className="flex items-center gap-2">
            {theme === "dark" ? (
              <Moon className="h-4 w-4 text-indigo-400" />
            ) : (
              <Sun className="h-4 w-4 text-amber-500" />
            )}
            <span>{theme === "dark" ? "Dark" : "Light"} Mode</span>
          </div>
        </Label>
        <Switch
          id="theme-toggle"
          checked={theme === "dark"}
          onCheckedChange={() => toggleTheme()}
        />
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={className}
      title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5 text-amber-500" />
      ) : (
        <Moon className="h-5 w-5 text-slate-700" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
} 