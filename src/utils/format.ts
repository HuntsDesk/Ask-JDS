/**
 * Utility functions for formatting values
 */

/**
 * Format a price as USD currency
 * 
 * @param price - The price to format
 * @returns Formatted price string
 */
export function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined) {
    return '$0.00';
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
}

/**
 * Format a date as a human-readable string
 * 
 * @param date - The date to format
 * @param format - The format to use (short, medium, or long)
 * @returns Formatted date string
 */
export function formatDate(date: Date | string | null | undefined, format: 'short' | 'medium' | 'long' = 'medium'): string {
  if (!date) {
    return '';
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  switch (format) {
    case 'short':
      // MM/DD/YYYY
      return dateObj.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      });
    
    case 'medium':
      // Month DD, YYYY
      return dateObj.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    
    case 'long':
      // Month DD, YYYY at HH:MM AM/PM
      return dateObj.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    
    default:
      return dateObj.toLocaleDateString();
  }
}

/**
 * Format a number with commas
 * 
 * @param num - The number to format
 * @returns Formatted number string
 */
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) {
    return '0';
  }
  
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Format a time duration in seconds to human-readable format
 * 
 * @param seconds - Duration in seconds
 * @returns Formatted time string
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || seconds < 0) {
    return '0:00';
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (minutes < 60) {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Format file size in bytes to human-readable format
 * 
 * @param bytes - Size in bytes
 * @returns Formatted size string
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || bytes === 0) {
    return '0 Bytes';
  }
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 