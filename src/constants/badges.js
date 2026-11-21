import React from 'react';

/**
 * Danh sách các danh hiệu (Badges) hiển thị dưới tên người dùng giống ảnh mẫu.
 * - Các danh hiệu như staff, bughunter, verified, supporter, medal, booster, og do Admin cấp trong Firestore (mảng `profile.badges` hoặc cờ boolean).
 * - Danh hiệu `premium` (Kim cương) tự động hiển thị khi tài khoản có Premium (`isPremium === true`) hoặc được Admin cấp `'premium'`.
 */
export const BADGE_DEFINITIONS = {
  staff: {
    key: 'staff',
    label: 'Staff / Admin',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" />
      </svg>
    )
  },
  bughunter: {
    key: 'bughunter',
    label: 'Bug Hunter',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5c-.49 0-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-6 8h-4v-2h4v2zm0-4h-4v-2h4v2z" />
      </svg>
    )
  },
  verified: {
    key: 'verified',
    label: 'Verified',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69 3.1 5.5l.34 3.7L1 12l2.44 2.79-.34 3.7 3.61.82L8.6 22.5l3.4-1.47 3.4 1.46 1.89-3.19 3.61-.82-.34-3.69L23 12zm-12.91 4.72l-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z" />
      </svg>
    )
  },
  premium: {
    key: 'premium',
    label: 'Premium',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 3h12l4 6-10 12L2 9z" />
        <path d="M2 9h20" />
        <path d="M12 21 8 9l2-6" />
        <path d="M12 21 16 9l-2-6" />
      </svg>
    )
  },
  supporter: {
    key: 'supporter',
    label: 'Early Supporter',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
      </svg>
    )
  },
  medal: {
    key: 'medal',
    label: 'Special Medal',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M17 3H7v5.3l5 3.1 5-3.1V3zm-5 10l-3.1 1.9.8 3.5-2.7 2.3 3.6.3L12 24l1.4-3.3 3.6-.3-2.7-2.3.8-3.5L12 13z" />
      </svg>
    )
  },
  booster: {
    key: 'booster',
    label: 'Server Booster',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3a9 9 0 0 0-9 9c0 2.92 1.39 5.51 3.54 7.16l1.42-1.42A6.98 6.98 0 0 1 5 12a7 7 0 1 1 14 0c0 2.35-1.16 4.42-2.96 5.74l1.42 1.42A8.98 8.98 0 0 0 21 12a9 9 0 0 0-9-9zm1 5l-3.5 5.5a1.5 1.5 0 1 0 2.5 1.5L13 8z" />
      </svg>
    )
  },
  og: {
    key: 'og',
    label: 'OG Creator',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z" />
      </svg>
    )
  }
};

/**
 * Trả về danh sách các badge của một hồ sơ:
 * - Lấy từ mảng `profile.badges` do Admin cấp (ví dụ: ['staff', 'verified', 'supporter'])
 * - Các cờ boolean do Admin cấp (`profile.isAdmin`, `profile.isStaff`, `profile.isVerified`, `profile.isBugHunter`, `profile.isSupporter`, `profile.isOg`)
 * - Nếu tài khoản là Premium (`isPremium === true`), tự động thêm icon Kim cương (`premium`).
 */
export function resolveProfileBadges(profile = {}, isPremium = false) {
  const keys = new Set();

  if (Array.isArray(profile.badges)) {
    profile.badges.forEach((k) => {
      const normalized = String(k || '').toLowerCase().trim();
      if (BADGE_DEFINITIONS[normalized]) {
        keys.add(normalized);
      }
    });
  }

  if (profile.isAdmin || profile.isStaff) keys.add('staff');
  if (profile.isBugHunter) keys.add('bughunter');
  if (profile.isVerified) keys.add('verified');
  if (isPremium || profile.isPremiumBadge) keys.add('premium');
  if (profile.isSupporter) keys.add('supporter');
  if (profile.isMedal) keys.add('medal');
  if (profile.isBooster) keys.add('booster');
  if (profile.isOg) keys.add('og');

  return Array.from(keys)
    .map((k) => BADGE_DEFINITIONS[k])
    .filter(Boolean);
}
