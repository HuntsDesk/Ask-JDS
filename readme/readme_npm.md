# NPM Run Commands

## Development Commands

- `npm run dev:askjds` - Start the development server for Ask JDS (port 5173)
- `npm run dev:jds` - Start the development server for JD Simplified (port 5174)

## Build Commands

- `npm run build:askjds` - Build the Ask JDS application (outputs to dist/askjds)
- `npm run build:jds` - Build the JD Simplified application (outputs to dist/jdsimplified)
- `npm run build` - Build both applications (runs both build commands sequentially)

## Other Commands

- `npm run type-check` - Run TypeScript type checking without emitting files
- `npm run lint` - Run ESLint to check for code style and potential errors
- `npm run preview` - Preview the built application locally

## Environment Variables

The application uses the following environment variables for domain configuration:
- `VITE_ASKJDS_DOMAIN` - Domain for Ask JDS
- `VITE_JDSIMPLIFIED_DOMAIN` - Domain for JD Simplified
- `BUILD_DOMAIN` - Used during build/dev to determine which application to build 

## Application Overview

### Multi-Domain Architecture

This project contains two applications that share a common codebase but deploy to different domains:

1. **Ask JDS** - Focused on providing AI-powered chat assistance for law students
2. **JD Simplified** - Comprehensive platform with additional educational features

Both applications share the same core functionality including:
- User authentication and account management
- AI chat capabilities
- Dark/light theme support
- Responsive sidebar navigation

### Shared Functionality

The applications use a domain-based feature flag system to enable or disable certain components:

- **Chat Functionality**: Available in both domains
- **Flashcards**: Available in both domains
- **Courses**: Full implementation in JD Simplified, limited in Ask JDS
- **Settings**: User profile and subscription management in both domains

### Development Workflow

When developing, you can run either application independently:
- `npm run dev:askjds` for Ask JDS features
- `npm run dev:jds` for JD Simplified features

The `BUILD_DOMAIN` environment variable determines which set of features and styles are enabled during the build process.

### Implementation Details

The applications use a shared component library with conditional rendering based on the current domain. This approach allows for efficient code maintenance while providing tailored experiences for each domain.

The domain detection logic is implemented through the `useDomain` hook from `@/lib/domain-context` which determines the current domain context at runtime. 