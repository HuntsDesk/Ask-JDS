import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Shield, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";

export function SetAdminStatus() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSetAdmin = async () => {
    if (!email) {
      setStatus("error");
      setMessage("Please enter a valid email address");
      return;
    }
    
    try {
      setStatus("loading");
      setMessage("");
      
      // First, try using the RPC function to set the user as admin by email
      const { data: rpcResult, error: rpcError } = await supabase
        .rpc('set_user_as_admin', { user_email: email });
      
      if (!rpcError && rpcResult === true) {
        setStatus("success");
        setMessage(`Successfully set ${email} as admin!`);
        return;
      }
      
      if (rpcError) {
        console.log('RPC method failed, trying direct method:', rpcError);
      }
      
      // If RPC fails, try finding the user and updating directly
      const { data: userData, error: userError } = await supabase
        .from('auth.users')
        .select('id')
        .eq('email', email)
        .single();
      
      if (userError) {
        console.error('Error finding user by email:', userError);
        setStatus('error');
        setMessage(`Error finding user: ${userError.message}`);
        return;
      }
      
      if (!userData) {
        setStatus('error');
        setMessage(`No user found with email: ${email}`);
        return;
      }
      
      // Try to use the upgrade_to_admin function
      const { error: upgradeError } = await supabase
        .rpc('upgrade_to_admin', { user_id: userData.id });
      
      if (upgradeError) {
        console.error('Error using upgrade_to_admin:', upgradeError);
        
        // Fall back to directly updating the profile
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ is_admin: true })
          .eq('id', userData.id);
        
        if (profileError) {
          console.error('Error updating profile admin status:', profileError);
          setStatus('error');
          setMessage(`Error updating profile: ${profileError.message}`);
          return;
        }
      }
      
      setStatus("success");
      setMessage(`Successfully set ${email} as admin!`);
    } catch (error: any) {
      console.error('Error setting admin status:', error);
      setStatus("error");
      setMessage(`Error: ${error.message}`);
    }
  };

  // If the current user is the one being made admin, allow them to refresh their session
  const isCurrentUser = user && email === user.email;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            className="mr-2" 
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Admin Setup</h1>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5 text-blue-500" />
                Set Admin Status
              </CardTitle>
              <CardDescription>
                Make a user an administrator by providing their email address
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    User Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status === "loading"}
                  />
                </div>
                {message && (
                  <div
                    className={`p-3 rounded text-sm ${
                      status === "success" 
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}
                  >
                    {message}
                    {status === "success" && isCurrentUser && (
                      <div className="mt-2">
                        <Button 
                          size="sm" 
                          onClick={() => window.location.reload()}
                          className="w-full"
                        >
                          Refresh Session to Apply Changes
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={handleSetAdmin}
                disabled={!email || status === "loading"}
              >
                {status === "loading" ? "Processing..." : "Set as Admin"}
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
              <CardDescription>How to set up the admin user</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div>
                <h3 className="font-medium mb-1">Step 1: Enter Admin Email</h3>
                <p className="text-sm text-muted-foreground">
                  Enter the email address of the user you want to make an administrator.
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-1">Step 2: Set Admin Status</h3>
                <p className="text-sm text-muted-foreground">
                  Click the "Set as Admin" button. This will update the user's permissions in the database.
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-1">Step 3: Refresh Session</h3>
                <p className="text-sm text-muted-foreground">
                  If you're setting your own account as admin, you'll need to refresh your session to apply the changes.
                  You can do this by clicking the "Refresh Session" button that will appear, or by logging out and back in.
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-1">Important Note</h3>
                <p className="text-sm text-muted-foreground">
                  This page is accessible to anyone with the URL for initial setup purposes. 
                  Make sure to restrict access to it after your first admin is created.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default SetAdminStatus; 