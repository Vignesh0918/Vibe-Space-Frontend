/**
 * formatTime.js
 * Utility that formats an ISO timestamp or date object into a relative string representation
 * (e.g., "Just now", "2m ago", "1h ago", "Yesterday", "3d ago").
 */

export default function formatTime(timestamp) {
  if (!timestamp) return '';
  
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now - past;
  
  // Handle future dates or clock mismatch
  if (diffMs < 0) return 'Just now';
  
  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 60) return 'Just now';
  
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  
  // Return absolute localized short date for older timestamps (e.g., "May 21")
  return past.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
