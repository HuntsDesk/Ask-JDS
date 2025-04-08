// Function to initialize theme based on user preference
export function initializeTheme() {
  // Check for theme preference in localStorage
  const storedTheme = localStorage.getItem('theme');
  
  // Check if user prefers dark mode
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Set the theme - either from localStorage or based on system preference
  if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// Export a function to toggle theme
export function toggleTheme() {
  const isDark = document.documentElement.classList.contains('dark');
  
  if (isDark) {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  } else {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }
  
  // Dispatch an event so other components can react to theme changes
  window.dispatchEvent(new Event('themeChange'));
}

// Set theme to specific value
export function setTheme(theme: 'light' | 'dark') {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }
  
  // Dispatch an event so other components can react to theme changes
  window.dispatchEvent(new Event('themeChange'));
} 