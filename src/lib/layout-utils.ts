export function updateInputOffset() {
  const baseHeight = 56 + 8;
  const isMobile = window.innerWidth < 640;
  const safeArea = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-bottom)') || '0'
  );
  document.documentElement.style.setProperty(
    '--chat-input-offset',
    isMobile ? `${baseHeight + safeArea}px` : '0px'
  );
} 