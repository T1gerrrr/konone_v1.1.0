// Mẫu hồ sơ KHÔNG còn viết cứng trong mã: quản trị viên thêm/sửa/xóa ở trang Admin → tab "Template".
// Dữ liệu lưu ở bộ sưu tập Firestore `templates`, trang Mẫu chỉ đọc.

// Các trường của hồ sơ được ghi/đọc khi dùng hoặc tạo mẫu
// Toàn bộ phần THIẾT KẾ của hồ sơ (không gồm thông tin cá nhân như tên, mô tả, avatar, liên kết, nhạc)
export const TEMPLATE_FIELDS = [
  'layout',
  'cardColor',
  'lanyardCardColor',
  'lanyardStrapColor',
  'lanyardBadgeLabel',
  'textColor',
  'bgColor',
  'iconColor',
  'effect',
  'profileOpacity',
  'profileBlur',
  'profileGradient',
  'gradientFrom',
  'gradientTo',
  'textFontFamily',
  'text3DEffect',
  'glowSettings',
  'nameScale',
  'bioScale',
  'backgroundImage',
  'backgroundVideo',
  'coverImage',
  'avatarFrame',
  'cursorIcon',
  'musicBoxColor',
  'musicAccentColor',
  'socialPosition',
  'otherSettings',
  'splashCursor',
  'blobCursor',
  'cursorFx',
  'musicUrl'
];

export const TEMPLATE_LAYOUTS = [
  ['card', 'Basic (Thẻ)'],
  ['lanyard', 'Lanyard (Premium)'],
  ['web', 'Web (Premium)']
];

export const TEMPLATE_EFFECTS = [
  ['none', 'Không có'],
  ['snow', 'Tuyết rơi'],
  ['particles', 'Hạt sáng'],
  ['confetti', 'Pháo giấy'],
  ['fireworks', 'Pháo hoa'],
  ['rain', 'Mưa (Premium)'],
  ['stars', 'Bầu trời sao (Premium)'],
  ['leaves', 'Lá rơi (Premium)'],
  ['aurora', 'Cực quang (Premium)'],
  ['matrix', 'Matrix (Premium)'],
  ['nebula', 'Tinh vân (Premium)']
];

export const TEMPLATE_FONTS = ['Arial', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana', 'Impact', 'Trebuchet MS', 'Monaco'];

// Con trỏ có sẵn (giống Dashboard > Con trỏ tùy chỉnh)
export const TEMPLATE_CURSOR_PRESETS = [
  ['', 'Con trỏ mặc định'],
  ['https://raw.githubusercontent.com/T1gerrrr/konone/refs/heads/main/icon_1.png', 'KonOne Cursor 1'],
  ['/cursor.svg', 'Con thỏ']
];

// Hiệu ứng chuột chọn được ở Template (giống Dashboard)
export const TEMPLATE_CURSOR_EFFECTS = [
  ['', 'Không có'],
  ['splash', 'Splash Cursor'],
  ['blob', 'Blob Cursor'],
  ['bubble', 'Bubble Cursor'],
  ['rainbow', 'Rainbow Cursor'],
  ['trail3d', '3D Trail Cursor'],
  ['canvas', 'Canvas Cursor']
];

// Giá trị mặc định khi bật Splash / Blob (khớp Dashboard)
export const SPLASH_DEFAULTS = {
  enabled: true, rainbow: false, colors: ['#f65c5c', '#dc2626', '#a21caf'], size: 1, force: 1, swirl: 3, trail: 1,
  clickSplash: true, colorSpeed: 1, intensity: 1, momentum: 1, shading: 1, glow: 0, quality: 'high'
};
export const BLOB_DEFAULTS = {
  enabled: true, material: 'chrome', color: '#3B82F6', blend: 'normal', size: 140, morph: 0, morphSpeed: 0.4, depth: 1,
  trail: 16, lag: 0.55, goo: 1, stretch: 0.6, wobble: 1, drip: 0, shine: 1, splash: true, splashCount: 6, splashSpeed: 0.5,
  splashSize: 0.5, splashGravity: 0, regrow: 0.5, shadow: false, hideCursor: true
};

// Những phần của mẫu cần Premium -> hiện icon kim cương + tự đánh dấu mẫu Premium
export function templatePremiumReasons(preset = {}) {
  const out = [];
  if (['lanyard', 'web'].includes(preset.layout)) out.push('Bố cục ' + preset.layout);
  if (preset.effect && preset.effect !== 'none') out.push('Hiệu ứng nền');
  if (preset.backgroundVideo) out.push('Video nền');
  if (preset.splashCursor?.enabled || preset.blobCursor?.enabled || preset.cursorFx?.id) out.push('Hiệu ứng chuột');
  if (preset.cursorIcon) out.push('Con trỏ tùy chỉnh');
  return out;
}
