import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/lib/theme-provider';
import { Moon, Sun, Monitor } from 'lucide-react';

export default function AppearancePage() {
  const { theme, setTheme } = useTheme();
  
  return (
    <div className="space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Appearance Settings</h1>
        <p className="text-gray-500 dark:text-gray-300">
          Customize the application appearance
        </p>
      </div>
      
      {/* Theme Settings Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Theme Settings</h2>
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">Color Theme</h3>
              <RadioGroup 
                value={theme} 
                onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}
                className="flex flex-col space-y-4"
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem 
                    value="light" 
                    id="light" 
                    className="border-gray-300 dark:border-gray-600 text-jdblue dark:text-white dark:focus:ring-offset-gray-900"
                  />
                  <Label htmlFor="light" className="flex items-center space-x-2 cursor-pointer text-gray-700 dark:text-gray-300">
                    <Sun className="h-5 w-5 text-amber-500" />
                    <span>Light</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem 
                    value="dark" 
                    id="dark" 
                    className="border-gray-300 dark:border-gray-600 text-jdblue dark:text-white dark:focus:ring-offset-gray-900"
                  />
                  <Label htmlFor="dark" className="flex items-center space-x-2 cursor-pointer text-gray-700 dark:text-gray-300">
                    <Moon className="h-5 w-5 text-indigo-500" />
                    <span>Dark</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem 
                    value="system" 
                    id="system" 
                    className="border-gray-300 dark:border-gray-600 text-jdblue dark:text-white dark:focus:ring-offset-gray-900"
                  />
                  <Label htmlFor="system" className="flex items-center space-x-2 cursor-pointer text-gray-700 dark:text-gray-300">
                    <Monitor className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    <span>System</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                System theme will automatically switch between light and dark themes based on your system preferences.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 