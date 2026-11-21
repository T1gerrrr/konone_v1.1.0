// Quy tắc Premium dùng chung cho Editor, Links, Dashboard và trang Public.
import { confirmDialog } from '../notify/notify';

// Bố cục chỉ dành cho Premium. Hiện cả 'card', 'lanyard' (Thẻ) và 'web' đều miễn phí.
export const PREMIUM_LAYOUTS = [];

// Số liên kết / icon tối đa cho tài khoản miễn phí
export const FREE_LINK_LIMIT = 3;

export function isPremiumActive(profile) {
  if (!profile?.isPremium || !profile.premiumExpiresAt) return false;
  const v = profile.premiumExpiresAt;
  const until = typeof v.toDate === 'function' ? v.toDate() : new Date(v);
  return !Number.isNaN(until.getTime()) && until > new Date();
}

export function countLinks(socialLinks, customLinks) {
  const socials = Object.values(socialLinks || {}).filter((v) => Boolean(v && String(v).trim())).length;
  const customs = Array.isArray(customLinks) ? customLinks.filter((c) => c?.url).length : 0;
  return socials + customs;
}

/**
 * Danh sách tính năng Premium đang được dùng (để chặn khi lưu với tài khoản miễn phí).
 */
export function premiumViolations({ layout, effect, splashEnabled, blobEnabled, backgroundVideo, linkCount }, lang = 'vi') {
  const vi = lang === 'vi';
  const out = [];
  if (PREMIUM_LAYOUTS.includes(layout)) {
    out.push(layout === 'web' ? (vi ? 'Bố cục WEB' : 'WEB layout') : (vi ? 'Bố cục Thẻ' : 'Card (lanyard) layout'));
  }
  if (effect && effect !== 'none') out.push('Background Effects');
  if (splashEnabled || blobEnabled) out.push(vi ? 'Hiệu ứng chuột' : 'Cursor effects');
  if (backgroundVideo && String(backgroundVideo).trim()) out.push('Background Video');
  if (linkCount > FREE_LINK_LIMIT) {
    out.push(vi ? `Hơn ${FREE_LINK_LIMIT} liên kết` : `More than ${FREE_LINK_LIMIT} links`);
  }
  return out;
}

/**
 * Hỏi người dùng có muốn nâng cấp không. Trả về true nếu được phép dùng tính năng.
 */
export function askUpgrade(isPremium, featureName, navigate, lang = 'vi') {
  if (isPremium) return true;
  const vi = lang === 'vi';
  confirmDialog({
    title: vi ? 'Tính năng Premium' : 'Premium feature',
    message: vi
      ? `"${featureName}" chỉ dành cho tài khoản Premium.`
      : `"${featureName}" is available on Premium only.`,
    confirmText: vi ? 'Nâng cấp Premium' : 'Upgrade to Premium',
    cancelText: vi ? 'Để sau' : 'Not now'
  }).then((ok) => {
    if (ok && navigate) navigate('/premium');
  });
  return false;
}
