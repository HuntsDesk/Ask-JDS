import http from 'http';
import https from 'https';

// Configuration
const PORT = 9999;
const SUPABASE_URL = 'https://prbbuxgirnecbkpdpgcb.supabase.co/functions/v1/stripe-webhook';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByYmJ1eGdpcm5lY2JrcGRwZ2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0NTkzNjIsImV4cCI6MjA2NDAzNTM2Mn0.WFvJN-61K6z7RHwjiybC7kq1zVIK6DgvhKlXWCzbnh8';

// Create a server
const server = http.createServer(async (req, res) => {
  if (req.method === 'POST') {
    console.log(`Received ${req.method} request`);
    
    // Get request body
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        // Forward request to Supabase
        const options = new URL(SUPABASE_URL);
        
        const proxyReq = https.request({
          hostname: options.hostname,
          port: options.port || 443,
          path: options.pathname,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
            'Stripe-Signature': req.headers['stripe-signature'],
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY
          }
        });
        
        // Handle proxy response
        proxyReq.on('response', proxyRes => {
          console.log(`Supabase responded with status: ${proxyRes.statusCode}`);
          
          let responseBody = '';
          proxyRes.on('data', chunk => {
            responseBody += chunk.toString();
          });
          
          proxyRes.on('end', () => {
            console.log('Response body:', responseBody);
            
            // Send response back to Stripe CLI
            res.statusCode = proxyRes.statusCode;
            Object.entries(proxyRes.headers).forEach(([key, value]) => {
              res.setHeader(key, value);
            });
            res.end(responseBody);
          });
        });
        
        // Handle errors in proxy request
        proxyReq.on('error', err => {
          console.error('Error forwarding request:', err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Failed to forward request' }));
        });
        
        // Send the request
        proxyReq.write(body);
        proxyReq.end();
      } catch (error) {
        console.error('Error processing request:', error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });
  } else {
    res.statusCode = 200;
    res.end('Stripe webhook proxy is running');
  }
});

// Start the server
server.listen(PORT, () => {
  console.log(`Stripe webhook proxy is running on http://localhost:${PORT}`);
  console.log(`Forwarding to: ${SUPABASE_URL}`);
  console.log(`Run: stripe listen --forward-to http://localhost:${PORT}`);
}); 