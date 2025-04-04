Create a React 18+ TypeScript monorepo-style boilerplate that supports multi-domain deployment from a single codebase. The architecture must enable per-domain builds, routing, and feature toggling.

⸻

1. Tech Stack
	•	React 18+
	•	TypeScript
	•	Vite as the build tool
	•	Tailwind CSS for styling
	•	React Router v6+ for SPA routing
	•	Supabase Auth (email/password, session persistence)

⸻

2. Multi-Domain Architecture

Implement support for multiple domains using:
	•	A DomainContext provider that detects the current domain via window.location.hostname
	•	A domain-based feature flag system (e.g., isAskJDS, isJDSimplified, isAdmin)
	•	Sample domains:
	•	askjds.com → package name: ask-jds
	•	jdsimplified.com → package name: ask-jds
	•	admin.jdsimplified.com → package name: admin

⸻

3. Environment Configuration

Use .env variables to configure domains and Supabase:

VITE_SUPABASE_URL=https://prbbuxgirnecbkpdpgcb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByYmJ1eGdpcm5lY2JrcGRwZ2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0NjY1NTAsImV4cCI6MjA1NTA0MjU1MH0.tUE2nfjVbY2NCr0duUyhC5Rx-fe5TMBeCoWlkzAxxds
VITE_ASKJDS_DOMAIN=askjds.com
VITE_JDSIMPLIFIED_DOMAIN=jdsimplified.com
VITE_ADMIN_DOMAIN=admin.jdsimplified.com



⸻

4. Build & Dev Scripts

Provide the following NPM scripts:

{
  "scripts": {
    "dev:askjds": "BUILD_DOMAIN=askjds vite",
    "dev:jds": "BUILD_DOMAIN=jds vite",
    "dev:admin": "BUILD_DOMAIN=admin vite",
    "build:askjds": "BUILD_DOMAIN=askjds vite build --outDir=dist/askjds",
    "build:jds": "BUILD_DOMAIN=jds vite build --outDir=dist/jdsimplified",
    "build:admin": "BUILD_DOMAIN=admin vite build --outDir=dist/admin",
    "build": "npm run build:askjds && npm run build:jds && npm run build:admin"
  }
}

The build should respect domain-specific configs and generate optimized output for each domain.

⸻

5. Routing Structure
	•	Use a domain-aware router that conditionally mounts routes based on the current domain
	•	Example:
	•	askjds.com/chat
	•	jdsimplified.com/courses
	•	admin.jdsimplified.com/dashboard

Use a hook like useDomain() to determine what features or routes to render.

⸻

6. Documentation

Include README.md sections on:
	•	Adding a new domain (domains.ts, .env, NPM script)
	•	Adding domain-specific routes or UI logic
	•	How domain-based feature flags work internally
	•	Authentication setup with Supabase

⸻

7. Quality Requirements
	•	Clean, modular component structure
	•	Comments for domain detection, build config, and feature toggling
	•	Modern React practices (e.g., hooks, suspense-ready routing)
	•	Type-safe throughout (no any usage)