# Ask-JDS Build System Documentation

This document explains the build system for the Ask-JDS project, including the domain-specific configurations, environment management, and optimization features.

## Multi-Domain Architecture

The Ask-JDS project supports multiple domains, each with its own configuration:

- **askjds**: The main Ask-JDS application
- **jdsimplified**: The JDS Simplified application
- **admin**: The administration panel

Each domain has separate:
- Build outputs (`dist_askjds`, `dist_jdsimplified`, `dist_admin`)
- Development servers (ports 5173, 5174, 5175)
- Environment configurations

## Build Commands

### Development

```bash
# Start development server for specific domain
npm run dev:askjds  # Port 5173
npm run dev:jds     # Port 5174
npm run dev:admin   # Port 5175

# Default development server (askjds)
npm run dev
```

### Production Builds

```bash
# Build for all domains
npm run build

# Build for specific domain
npm run build:askjds
npm run build:jds
npm run build:admin

# Full production build with optimizations
./scripts/build.sh

# Build with options
./scripts/build.sh --skip-clean --skip-check --only=askjds,admin
```

### Utility Commands

```bash
# Clean Vite cache
npm run clean         # Clean domain-specific caches
npm run clean:full    # Clean all caches including node_modules/.vite
npm run clean:dist    # Clean distribution directories
npm run clean:all     # Clean everything

# Environment management
npm run env           # Show current environment status
npm run env:askjds    # Set environment to askjds
npm run env:jds       # Set environment to jds
npm run env:admin     # Set environment to admin
npm run env:backup    # Create environment backup
npm run env:restore   # Restore from latest backup

# Force dependency optimization
npm run optimize
```

## Environment Management

The project uses a flat `.env` file for configuration. The `scripts/env-manager.js` script helps manage environment settings:

```bash
# Show current environment status
node scripts/env-manager.js status

# Set environment for specific domain
node scripts/env-manager.js set askjds|jds|admin

# Create backup of current environment
node scripts/env-manager.js backup

# Restore from latest backup
node scripts/env-manager.js restore
```

Environment templates are stored in `.env.template` to provide a reference for required variables.

## Vite Configuration

The Vite configuration (`vite.config.ts`) includes:

1. **Domain-specific settings**:
   - Separate output directories
   - Different development server ports
   - Domain-specific environment variables

2. **Optimization features**:
   - Cache management with domain isolation
   - Dependency pre-bundling
   - Smart chunk splitting
   - HMR improvements

3. **Performance optimizations**:
   - Granular cache invalidation
   - Smart dependency tracking
   - Optimized build settings for faster rebuilds

## Build Process Optimization

The build process includes several optimization features:

1. **Smart caching**:
   - Domain-specific caches to prevent cross-contamination
   - Cache invalidation based on relevant file changes only
   - Separate cache directories for each domain

2. **Dependency management**:
   - Pre-bundling of critical dependencies
   - Optimized chunk splitting for better loading performance
   - Exclusion of problematic packages from optimization

3. **Build performance**:
   - Parallel builds for multiple domains
   - Optimized ESBuild configuration
   - Minimal rebuilds when configuration changes

## Troubleshooting

If you encounter build issues:

1. **Clean the cache**: `npm run clean:full`
2. **Restore environment**: `npm run env:restore`
3. **Force dependency optimization**: `npm run optimize`
4. **Rebuild with full checks**: `./scripts/build.sh`

For persistent issues, check the Vite logs for more detailed information about the build process.

## Advanced Configuration

### Custom Build Domains

To add a new domain:

1. Add build commands to `package.json`
2. Update `vite.config.ts` with the new domain
3. Add environment management scripts

### Optimization Settings

The optimization behavior can be customized by:

1. Adjusting the cache key generation in `vite.config.ts`
2. Modifying the `manualChunks` configuration
3. Changing the included/excluded dependencies

## Upgrading Vite

When upgrading Vite:

1. Clean all caches: `npm run clean:all`
2. Update the dependency: `npm install vite@latest`
3. Test each domain: `npm run dev:askjds`, etc.
4. Rebuild all domains: `npm run build` 