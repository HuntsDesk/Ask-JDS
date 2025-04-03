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