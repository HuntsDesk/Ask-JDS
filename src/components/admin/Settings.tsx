import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Database, Key, UserCog, Shield, Moon, Sun } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState("general");
  const [darkMode, setDarkMode] = useState(false);
  
  // Initialize dark mode state from document class on component mount
  useEffect(() => {
    setDarkMode(document.documentElement.classList.contains('dark'));
  }, []);
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };
  
  return (
    <AdminLayout title="Admin Settings">
      <div className="space-y-6">
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-8">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="api">API Keys</TabsTrigger>
            <TabsTrigger value="admin">Admin Access</TabsTrigger>
          </TabsList>
          
          {/* General Settings */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <SettingsIcon className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>General Settings</CardTitle>
                </div>
                <CardDescription>
                  Configure general application settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="site-name">Site Name</Label>
                    <Input id="site-name" defaultValue="JD Simplified" />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="support-email">Support Email</Label>
                    <Input id="support-email" type="email" defaultValue="support@jdsimplified.com" />
                  </div>
                  
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="dark-mode" className="flex-1">
                      <div className="flex items-center gap-2">
                        {darkMode ? (
                          <Moon className="h-4 w-4 text-indigo-400" />
                        ) : (
                          <Sun className="h-4 w-4 text-amber-500" />
                        )}
                        <span>Dark Mode</span>
                      </div>
                      <span className="block text-sm text-muted-foreground">
                        Toggle between light and dark theme
                      </span>
                    </Label>
                    <Switch 
                      id="dark-mode" 
                      checked={darkMode}
                      onCheckedChange={toggleDarkMode}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="maintenance-mode" className="flex-1">
                      Maintenance Mode
                      <span className="block text-sm text-muted-foreground">
                        Put the site in maintenance mode for all users
                      </span>
                    </Label>
                    <Switch id="maintenance-mode" />
                  </div>
                  
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="allow-signups" className="flex-1">
                      Allow New Signups
                      <span className="block text-sm text-muted-foreground">
                        Enable new user registrations
                      </span>
                    </Label>
                    <Switch id="allow-signups" defaultChecked />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Database Settings */}
          <TabsContent value="database" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Database className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Database Configuration</CardTitle>
                </div>
                <CardDescription>
                  Configure database connections and view table status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-md bg-muted p-4 space-y-3 dark:bg-gray-800">
                  <div className="flex justify-between">
                    <div className="font-medium">Connection Status</div>
                    <div className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-sm">Connected</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <div className="font-medium">Database Type</div>
                    <div className="text-sm">PostgreSQL 15.4</div>
                  </div>
                  <div className="flex justify-between">
                    <div className="font-medium">Host</div>
                    <div className="text-sm">db.supabase.co</div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Database Backups</h3>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Last backup</p>
                      <p className="text-sm text-muted-foreground">June 8, 2023 - 04:30 AM</p>
                    </div>
                    <Button>Backup Now</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* API Keys */}
          <TabsContent value="api" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Key className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>API Credentials</CardTitle>
                </div>
                <CardDescription>
                  Manage API keys for external services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="stripe-key">Stripe API Key</Label>
                    <Input id="stripe-key" type="password" defaultValue="sk_test_•••••••••••••••••••••••••" />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="openai-key">OpenAI API Key</Label>
                    <Input id="openai-key" type="password" defaultValue="sk-•••••••••••••••••••••••••••••" />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="anthropic-key">Anthropic API Key</Label>
                    <Input id="anthropic-key" type="password" defaultValue="sk-ant-••••••••••••••••••••••••" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button>Update API Keys</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Admin Access */}
          <TabsContent value="admin" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Admin Access</CardTitle>
                </div>
                <CardDescription>
                  Configure admin permissions and security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-md bg-amber-50 border border-amber-200 p-4 text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200">
                  <h3 className="font-medium mb-1">Security Notice</h3>
                  <p className="text-sm">
                    Changes to admin access settings are logged for security purposes.
                    All actions performed with admin privileges are audited.
                  </p>
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="admin-setup" className="flex-1">
                    Allow Admin Setup Page
                    <span className="block text-sm text-muted-foreground">
                      Enable access to the initial admin setup page at /setup-admin
                    </span>
                  </Label>
                  <Switch id="admin-setup" />
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="require-2fa" className="flex-1">
                    Require 2FA for Admin
                    <span className="block text-sm text-muted-foreground">
                      Force two-factor authentication for all admin users
                    </span>
                  </Label>
                  <Switch id="require-2fa" defaultChecked />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="session-timeout">Admin Session Timeout (minutes)</Label>
                  <Input id="session-timeout" type="number" defaultValue="60" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button>Save Security Settings</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings; 