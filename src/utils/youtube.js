// Utility functions for YouTube URLs

// Extract video ID from various YouTube URL formats
export function getYouTubeVideoId(url) {
  if (!url) return null;

  // Handle different YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

// Get YouTube embed URL
export function getYouTubeEmbedUrl(url) {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&rel=0&mute=0&disablekb=1&fs=0&iv_load_policy=3&cc_load_policy=0`;
}

// Check if URL is a valid YouTube URL
export function isValidYouTubeUrl(url) {
  return getYouTubeVideoId(url) !== null;
}

