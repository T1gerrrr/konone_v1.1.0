// Mẫu hồ sơ KHÔNG còn viết cứng trong mã: quản trị viên thêm/sửa/xóa ở trang Admin → tab "Template".
// Dữ liệu lưu ở bộ sưu tập Firestore `templates`, trang Mẫu chỉ đọc.

// Các trường của hồ sơ được ghi/đọc khi dùng hoặc tạo mẫu
export const TEMPLATE_FIELDS = [
  'layout',
  'cardColor',
  'lanyardCardColor',
  'lanyardStrapColor',
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
  'glowSettings'
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
