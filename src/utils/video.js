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
