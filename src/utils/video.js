// Link video trực tiếp (.mp4/.webm/...) dùng làm video nền, bỏ qua query/hash
export function isDirectVideoUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const u = new URL(url.trim());
    return /^https?:$/.test(u.protocol) && /\.(mp4|webm|ogv|ogg|mov|m4v)$/i.test(u.pathname);
  } catch {
    return false;
  }
}

// Link âm thanh/video trực tiếp dùng làm nhạc nền (mp3, m4a, mp4...)
export function isDirectMediaUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const u = new URL(url.trim());
    return /^https?:$/.test(u.protocol) && /\.(mp3|m4a|aac|wav|flac|opus|oga|ogg|mp4|webm|mov|m4v)$/i.test(u.pathname);
  } catch {
    return false;
  }
}

// Tên bài hát lấy từ tên tệp (bỏ đuôi); link dạng uuid thì dùng tên chung
export function trackNameFromUrl(url) {
  try {
    const file = decodeURIComponent(new URL(url).pathname.split('/').pop() || '').replace(/\.[a-z0-9]+$/i, '');
    return /^[0-9a-f-]{20,}$/i.test(file) ? 'Audio' : file;
  } catch {
    return 'Audio';
  }
}
