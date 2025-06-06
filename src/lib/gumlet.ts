export const constructGumletUrls = (assetId: string) => {
  const accountId = import.meta.env.VITE_GUMLET_ACCOUNT_ID;
  
  // Debug logging
  if (!accountId) {
    console.error('VITE_GUMLET_ACCOUNT_ID is not set. Current env vars:', {
      NODE_ENV: import.meta.env.NODE_ENV,
      MODE: import.meta.env.MODE,
      VITE_GUMLET_ACCOUNT_ID: import.meta.env.VITE_GUMLET_ACCOUNT_ID,
      allViteVars: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'))
    });
  }
  
  // Fallback to prevent undefined in URLs
  const safeAccountId = accountId || 'MISSING_ACCOUNT_ID';
  
  return {
    // Using HLS URL for non-DRM playback
    hlsUrl: `https://video.gumlet.io/${safeAccountId}/${assetId}/main.m3u8`,
    // Fallback to MP4 if needed
    mp4Url: `https://video.gumlet.io/${safeAccountId}/${assetId}/main.mp4`,
    thumbnailUrl: `https://video.gumlet.io/${safeAccountId}/${assetId}/thumbnail-1-0.png`,
  };
}; 