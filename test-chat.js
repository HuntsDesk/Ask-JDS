// Simple test for chat function
fetch('https://prbbuxgirnecbkpdpgcb.supabase.co/functions/v1/chat-google', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByYmJ1eGdpcm5lY2JrcGRwZ2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTI3MDQ2NDMsImV4cCI6MjAyODI4MDY0M30.LtGhAjpbJ__cKOxo7rY4eNZF46zxXfqgMsS1rRW0vDY'
  },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Test message' }]
  })
})
.then(r => r.text())
.then(console.log)
.catch(console.error); 