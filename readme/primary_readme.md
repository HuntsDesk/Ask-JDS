Multi-Domain Architecture – Ask JDS Platform

Overview

This monorepo powers three interrelated deployments from a single codebase:
	•	Ask JDS (askjds.com)
	•	JD Simplified (jdsimplified.com)
	•	Admin Panel (admin.jdsimplified.com)

Each is served via a domain-specific entrypoint with conditional logic driven by the DomainContext. All share the same Supabase backend, database, authentication, and UI foundations.

⸻

1. Architecture

projectEnv: {
  runtime: "vite + deno (no node.js)",
  backend: "supabase edge functions (deno only)",
  frontend: "vite/react (ESM only)/Tailwind CSS",
  env: "single flat .env only (no nesting or overrides)",
  denoImports: "use npm: or jsr:, never relative or node_modules",
  viteOptimizer: "uses esbuild to pre-bundle/cache deps; config/env/lockfile changes trigger reopt",
  viteVersion: "5.4.17 (upgradable if needed, no downgrade required)",
  importMaps: "deprecated in favor of npm: imports for deno",
  node: "explicitly NOT used anywhere in this project",
  optimizationPolicy: "minimize file churn; rapid config changes trigger Vite reopt loops"
}

	•	Deno-native Edge Functions (Deno.serve, npm: specifiers only)
	•	Shared ESM-only components
	•	Vite dev/build system

⸻

2. Routing & Domain Detection

Routing is driven by domain and feature flags from useDomain():

<Route path="/" element={
  isJDSimplified ? <JDSHomePage /> : <AskJDSHomePage />
} />

Routes are conditionally rendered in DomainRouter.tsx based on flags: isAskJDS, isJDSimplified, isAdmin.

Domain detection is resolved via:
	1.	import.meta.env.MODE
	2.	localStorage
	3.	location.hostname

If none match, default is askjds.

⸻

3. Build & Dev Scripts

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



⸻

4. Environment Variables

VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_ASKJDS_DOMAIN=askjds.com
VITE_JDSIMPLIFIED_DOMAIN=jdsimplified.com
VITE_ADMIN_DOMAIN=admin.jdsimplified.com
BUILD_DOMAIN=askjds|jds|admin

.env is flat. No .env.local or environment-based overrides are allowed.

⸻

5. Shared Functionality

All apps use:
	•	Supabase Auth
	•	Shared layouts and components
	•	Conditional rendering via useDomain()

Features:
	•	Chat: Ask JDS & JD Simplified
	•	Flashcards: Shared
	•	Courses: Full in JD Simplified
	•	Settings: Shared
	•	Admin tools: Only in Admin Panel

⸻

6. Troubleshooting & Optimization

If Vite throws:

504 (Outdated Optimize Dep)

Clear cache and restart:

rm -rf node_modules/.vite
npm run dev:askjds

Avoid rapid config changes (.env, tsconfig.json, package-lock.json) to prevent optimizer invalidation.

⸻

7. Migration Backlog

These files may still be duplicated under jdsimplified/. Validate and migrate as needed:

jdsimplified/src/components/home/HeroSection.tsx
jdsimplified/src/components/home/FeaturesSection.tsx
jdsimplified/src/components/home/NonServicesSection.tsx
jdsimplified/src/components/home/FeaturedCoursesSection.tsx
jdsimplified/src/components/home/TestimonialsSection.tsx
jdsimplified/src/components/home/AboutSection.tsx
jdsimplified/src/components/home/FaqSection.tsx
jdsimplified/src/components/home/ContactSection.tsx
jdsimplified/src/components/home/CtaSection.tsx
jdsimplified/src/components/Navbar.tsx
jdsimplified/src/pages/Dashboard.tsx
jdsimplified/src/components/AuthenticatedLayout.tsx
jdsimplified/src/index.css

	•	Verify shared dependencies
	•	Update import paths
	•	Test after migration

⸻

8. DomainRouter Template (Ref)

Located in: src/lib/domain-router.tsx

<Route path={currentDomain.routes.login} element={<AuthLayout><LoginPage /></AuthLayout>} />

{isAskJDS && (
  <Route path="/chat" element={<ProtectedRoute element={<MainLayout><ChatPage /></MainLayout>} />} />
)}

{isJDSimplified && (
  <Route path="/courses" element={<ProtectedRoute element={<MainLayout><CoursesPage /></MainLayout>} />} />
)}

{isAdmin && (
  <Route path="/dashboard" element={<ProtectedRoute element={<MainLayout><AdminDashboardPage /></MainLayout>} />} />
)}



⸻

9. Notes on AI Integration

Please ensure all AI responses understand:
	•	This is a Vite + Deno + ESM-only stack
	•	No Node.js runtime or CommonJS allowed
	•	Domain differences are presentational only — all apps share:
	•	Auth
	•	Supabase backend
	•	Component logic
