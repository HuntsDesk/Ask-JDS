import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Key, 
  Copy, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw,
  Terminal,
  Code
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';

interface TokenInfo {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  tokenType?: string;
  userId?: string;
  email?: string;
}

export function AuthTokenExtractor() {
  const { user, session } = useAuth();
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [showTokens, setShowTokens] = useState(false);
  const [customEndpoint, setCustomEndpoint] = useState('http://localhost:54321/functions/v1/activate-subscription');
  const [curlCommand, setCurlCommand] = useState('');
  const [nodeCommand, setNodeCommand] = useState('');
  const { toast } = useToast();

  const extractTokens = () => {
    try {
      const info: TokenInfo = {};

      // Extract from session if available
      if (session) {
        info.accessToken = session.access_token;
        info.refreshToken = session.refresh_token;
        info.expiresAt = session.expires_at;
        info.tokenType = session.token_type;
      }

      // Extract user info
      if (user) {
        info.userId = user.id;
        info.email = user.email;
      }

      // Try to extract from localStorage as fallback
      if (!info.accessToken) {
        try {
          const supabaseAuth = localStorage.getItem('sb-prbbuxgirnecbkpdpgcb-auth-token');
          if (supabaseAuth) {
            const authData = JSON.parse(supabaseAuth);
            if (authData.access_token) {
              info.accessToken = authData.access_token;
              info.refreshToken = authData.refresh_token;
              info.expiresAt = authData.expires_at;
              info.tokenType = authData.token_type;
            }
          }
        } catch (error) {
          console.warn('Could not parse localStorage auth data:', error);
        }
      }

      setTokenInfo(info);
      generateCommands(info);

      toast({
        title: "Tokens extracted",
        description: "Authentication tokens have been extracted successfully.",
      });

    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to extract tokens: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const generateCommands = (info: TokenInfo) => {
    if (!info.accessToken) return;

    // Generate curl command
    const curl = `curl -X POST "${customEndpoint}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${info.accessToken}" \\
  -d '{"customer_id": "YOUR_CUSTOMER_ID_HERE"}'`;

    setCurlCommand(curl);

    // Generate Node.js test command
    const node = `node test_subscription.js ${customEndpoint} ${info.accessToken}`;
    setNodeCommand(node);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: `${label} copied to clipboard.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to copy ${label}: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const maskToken = (token: string): string => {
    if (!token || token.length < 20) return token;
    return `${token.substring(0, 12)}...${token.substring(token.length - 8)}`;
  };

  const formatExpiresAt = (expiresAt?: number): string => {
    if (!expiresAt) return 'Unknown';
    const date = new Date(expiresAt * 1000);
    const now = new Date();
    const isExpired = date < now;
    const timeLeft = isExpired ? 'Expired' : `${Math.round((date.getTime() - now.getTime()) / (1000 * 60))} minutes`;
    return `${date.toLocaleString()} (${timeLeft})`;
  };

  useEffect(() => {
    if (user || session) {
      extractTokens();
    }
  }, [user, session]);

  useEffect(() => {
    if (tokenInfo) {
      generateCommands(tokenInfo);
    }
  }, [customEndpoint, tokenInfo]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Key className="h-5 w-5 text-blue-500" />
        <h2 className="text-xl font-bold">Auth Token Extractor</h2>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Security Warning:</strong> These tokens provide full access to your account. 
          Never share them in production or with untrusted parties. Use only for development and testing.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="extract" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="extract">Extract Tokens</TabsTrigger>
          <TabsTrigger value="commands">Test Commands</TabsTrigger>
          <TabsTrigger value="examples">Usage Examples</TabsTrigger>
        </TabsList>

        <TabsContent value="extract" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Authentication Information
                <Button onClick={extractTokens} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </CardTitle>
              <CardDescription>
                Current authentication status and extracted token information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">User Information</h4>
                  <div className="space-y-1 text-sm">
                    <div>Status: <span className={user ? 'text-green-600' : 'text-red-600'}>{user ? 'Authenticated' : 'Not authenticated'}</span></div>
                    {user && (
                      <>
                        <div>Email: <code className="text-xs">{user.email}</code></div>
                        <div>User ID: <code className="text-xs">{user.id}</code></div>
                        <div>Admin: <span className={user.user_metadata?.is_admin ? 'text-green-600' : 'text-gray-600'}>{user.user_metadata?.is_admin ? 'Yes' : 'No'}</span></div>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Session Information</h4>
                  <div className="space-y-1 text-sm">
                    <div>Session: <span className={session ? 'text-green-600' : 'text-red-600'}>{session ? 'Active' : 'No session'}</span></div>
                    {session && (
                      <>
                        <div>Token Type: <code className="text-xs">{session.token_type}</code></div>
                        <div>Expires: <code className="text-xs">{formatExpiresAt(session.expires_at)}</code></div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {tokenInfo && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Extracted Tokens</h4>
                    <Button
                      onClick={() => setShowTokens(!showTokens)}
                      variant="outline"
                      size="sm"
                    >
                      {showTokens ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                      {showTokens ? 'Hide' : 'Show'} Tokens
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {tokenInfo.accessToken && (
                      <div className="p-3 bg-muted rounded-md">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">Access Token</span>
                          <Button
                            onClick={() => copyToClipboard(tokenInfo.accessToken!, 'Access token')}
                            variant="ghost"
                            size="sm"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <code className="text-xs break-all">
                          {showTokens ? tokenInfo.accessToken : maskToken(tokenInfo.accessToken)}
                        </code>
                      </div>
                    )}

                    {tokenInfo.refreshToken && (
                      <div className="p-3 bg-muted rounded-md">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">Refresh Token</span>
                          <Button
                            onClick={() => copyToClipboard(tokenInfo.refreshToken!, 'Refresh token')}
                            variant="ghost"
                            size="sm"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <code className="text-xs break-all">
                          {showTokens ? tokenInfo.refreshToken : maskToken(tokenInfo.refreshToken)}
                        </code>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commands" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Testing Commands</CardTitle>
              <CardDescription>
                Ready-to-use commands for testing API endpoints with your authentication tokens
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="endpoint">Custom Endpoint</Label>
                <Input
                  id="endpoint"
                  value={customEndpoint}
                  onChange={(e) => setCustomEndpoint(e.target.value)}
                  placeholder="http://localhost:54321/functions/v1/your-function"
                />
              </div>

              {curlCommand && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">cURL Command</h4>
                    <Button
                      onClick={() => copyToClipboard(curlCommand, 'cURL command')}
                      variant="outline"
                      size="sm"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <Textarea
                    value={curlCommand}
                    readOnly
                    className="font-mono text-xs min-h-[120px]"
                  />
                </div>
              )}

              {nodeCommand && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Node.js Test Script</h4>
                    <Button
                      onClick={() => copyToClipboard(nodeCommand, 'Node.js command')}
                      variant="outline"
                      size="sm"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <div className="p-3 bg-muted rounded-md">
                    <code className="text-xs">{nodeCommand}</code>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examples" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Usage Examples
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">JavaScript Fetch Example</h4>
                <pre className="text-xs bg-muted p-3 rounded-md overflow-auto">
{`fetch('${customEndpoint}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN_HERE'
  },
  body: JSON.stringify({
    customer_id: 'cus_test123456789'
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`}
                </pre>
              </div>

              <div>
                <h4 className="font-medium mb-2">Python Requests Example</h4>
                <pre className="text-xs bg-muted p-3 rounded-md overflow-auto">
{`import requests

url = "${customEndpoint}"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_ACCESS_TOKEN_HERE"
}
data = {
    "customer_id": "cus_test123456789"
}

response = requests.post(url, headers=headers, json=data)
print(response.json())`}
                </pre>
              </div>

              <div>
                <h4 className="font-medium mb-2">Postman Setup</h4>
                <div className="text-sm space-y-2">
                  <p>1. Set method to <code>POST</code></p>
                  <p>2. Set URL to: <code>{customEndpoint}</code></p>
                  <p>3. In Headers tab, add:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><code>Content-Type: application/json</code></li>
                    <li><code>Authorization: Bearer YOUR_ACCESS_TOKEN_HERE</code></li>
                  </ul>
                  <p>4. In Body tab, select "raw" and "JSON", then add:</p>
                  <pre className="text-xs bg-muted p-2 rounded">{"{"}"customer_id": "cus_test123456789"{"}"}</pre>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                Testing Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <div>
                    <strong>Token Expiration:</strong> Access tokens typically expire after 1 hour. 
                    If you get 401 errors, refresh this page to get a new token.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <div>
                    <strong>Local Development:</strong> Make sure your Supabase local development server is running 
                    on port 54321 when testing local endpoints.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <div>
                    <strong>CORS Issues:</strong> If testing from a browser, ensure your Edge Function 
                    includes proper CORS headers for your domain.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 