// TwicPics Image Optimization Utility (Static Images Only)
// Videos handled by Gumlet CDN separately
// Based on TwicPics documentation: https://www.twicpics.com/docs/essentials/path-configuration

const TWICPICS_DOMAIN = import.meta.env.VITE_TWICPICS_DOMAIN || 'jdsimplified.twic.pics';
const TWICPICS_URL = `https://${TWICPICS_DOMAIN}`;

export interface TwicPicsOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'auto';
  cover?: string; // e.g., "1:1", "16:9"
  resize?: number;
  crop?: string;
  blur?: number;
}

// Validation helper to ensure path structure is correct
const validatePath = (path: string): string => {
  // Remove leading slash if present
  const cleanPath = path.replace(/^\/+/, '');
  
  // Ensure path doesn't end with slash
  return cleanPath.replace(/\/+$/, '');
};

// Fallback handler for image loading errors
export const handleTwicPicsError = (
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackSrc?: string
) => {
  const img = event.currentTarget;
  
  if (fallbackSrc && img.src !== fallbackSrc) {
    console.warn(`TwicPics image failed to load: ${img.src}. Falling back to: ${fallbackSrc}`);
    img.src = fallbackSrc;
  } else {
    console.error(`TwicPics image failed to load and no fallback provided: ${img.src}`);
    // Set a default broken image or hide the element
    img.style.display = 'none';
  }
};

export const buildTwicPicsUrl = (
  path: string,
  options: TwicPicsOptions = {}
): string => {
  const validatedPath = validatePath(path);
  const baseUrl = `${TWICPICS_URL}/${validatedPath}`;
  
  const transformations: string[] = [];
  
  // Add transformations based on options
  if (options.cover) {
    transformations.push(`cover=${options.cover}`);
  }
  
  if (options.resize) {
    transformations.push(`resize=${options.resize}`);
  }
  
  if (options.width && options.height) {
    transformations.push(`resize=${options.width}x${options.height}`);
  } else if (options.width) {
    transformations.push(`resize=${options.width}`);
  }
  
  if (options.quality) {
    transformations.push(`quality=${options.quality}`);
  }
  
  if (options.format) {
    transformations.push(`output=${options.format}`);
  }
  
  if (options.crop) {
    transformations.push(`crop=${options.crop}`);
  }
  
  if (options.blur) {
    transformations.push(`blur=${options.blur}`);
  }
  
  // Build the final URL with transformations
  if (transformations.length > 0) {
    return `${baseUrl}?twic=v1/${transformations.join('/')}`;
  }
  
  return baseUrl;
};

// Preset configurations for common static image use cases
export const twicPicsPresets = {
  // Hero images and banners
  hero: (path: string) => buildTwicPicsUrl(path, {
    cover: '21:9',
    width: 1200,
    quality: 85,
    format: 'auto'
  }),
  
  // Logo images
  logo: (path: string, width: number = 200) => buildTwicPicsUrl(path, {
    width,
    quality: 95,
    format: 'auto'
  }),
  
  // Profile pictures / avatars
  avatar: (path: string, size: number = 80) => buildTwicPicsUrl(path, {
    cover: '1:1',
    width: size,
    height: size,
    quality: 90,
    format: 'auto'
  }),
  
  // Flashcard demo images
  flashcardDemo: (path: string) => buildTwicPicsUrl(path, {
    width: 400,
    quality: 85,
    format: 'auto'
  }),
  
  // Chat demo screenshots
  chatDemo: (path: string) => buildTwicPicsUrl(path, {
    width: 600,
    quality: 85,
    format: 'auto'
  }),
  
  // Thumbnail-sized images
  thumbnail: (path: string) => buildTwicPicsUrl(path, {
    cover: '16:9',
    width: 300,
    quality: 80,
    format: 'auto'
  }),
  
  // High quality images for modals/lightboxes
  highQuality: (path: string) => buildTwicPicsUrl(path, {
    width: 1920,
    quality: 95,
    format: 'auto'
  })
};

// Helper for responsive images
export const generateResponsiveSet = (
  path: string,
  sizes: number[],
  options: Omit<TwicPicsOptions, 'width'> = {}
): string => {
  const srcSet = sizes
    .map(size => {
      const url = buildTwicPicsUrl(path, { ...options, width: size });
      return `${url} ${size}w`;
    })
    .join(', ');
  
  return srcSet;
};

// React component helper with error handling
export const TwicPicsImage: React.FC<{
  src: string;
  fallbackSrc?: string;
  options?: TwicPicsOptions;
  className?: string;
  alt: string;
  loading?: 'lazy' | 'eager';
}> = ({ src, fallbackSrc, options = {}, className, alt, loading = 'lazy', ...props }) => {
  return (
    <img
      src={buildTwicPicsUrl(src, options)}
      onError={(e) => handleTwicPicsError(e, fallbackSrc)}
      className={className}
      alt={alt}
      loading={loading}
      {...props}
    />
  );
};

// Debug helper to check if TwicPics is configured
export const debugTwicPics = () => {
  console.log('TwicPics Configuration (Images Only):', {
    domain: TWICPICS_DOMAIN,
    baseUrl: TWICPICS_URL,
    isProduction: import.meta.env.PROD,
    hasCustomDomain: import.meta.env.VITE_TWICPICS_DOMAIN !== undefined,
    note: 'Videos handled by Gumlet CDN separately'
  });
};

export default {
  buildUrl: buildTwicPicsUrl,
  presets: twicPicsPresets,
  responsiveSet: generateResponsiveSet,
  Image: TwicPicsImage,
  handleError: handleTwicPicsError,
  debug: debugTwicPics,
  domain: TWICPICS_DOMAIN,
  baseUrl: TWICPICS_URL
}; 