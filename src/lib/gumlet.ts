export const constructGumletUrls = (assetId: string) => {
  const accountId = import.meta.env.VITE_GUMLET_ACCOUNT_ID;
  return {
    // Using HLS URL for non-DRM playback
    hlsUrl: `https://video.gumlet.io/${accountId}/${assetId}/main.m3u8`,
    // Fallback to MP4 if needed
    mp4Url: `https://video.gumlet.io/${accountId}/${assetId}/main.mp4`,
    thumbnailUrl: `https://video.gumlet.io/${accountId}/${assetId}/thumbnail-1-0.png`,
  };
}; 