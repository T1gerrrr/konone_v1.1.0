// Nội dung trả lời tạm thời cho khung chat (chưa có AI).
//
// KHI TÍCH HỢP AI: chỉ cần sửa hàm getReply() ở cuối file này, ví dụ gọi API:
//   const res = await fetch('/api/chat', { method: 'POST', body: JSON.stringify({ message, lang }) });
//   const data = await res.json();
//   return { lines: [data.reply], links: [] };
// Component ChatWidget không cần thay đổi.

export const LEGAL_EMAIL = 'konone@gmail.com';
export const SUPPORT_EMAIL = 'konone@gmail.com';

export const TOPICS = [
  {
    id: 'bio',
    label: { vi: 'Hướng dẫn tạo BIO', en: 'How to create your BIO' },
    answer: {
      vi: [
        'Tạo trang BIO của bạn chỉ với vài bước:',
        '1. Đăng nhập rồi vào Dashboard.',
        '2. Chọn "Edit profile" để nhập tên người dùng (chữ thường và số), tên hiển thị, tiểu sử, ảnh đại diện và ảnh nền.',
        '3. Thêm các liên kết mạng xã hội hoặc website của bạn.',
        '4. Vào "Edit layout" hoặc chọn mẫu giao diện để tùy biến bố cục.',
        '5. Lưu lại. Trang của bạn sẽ có địa chỉ dạng konone/tên-người-dùng để chia sẻ.',
      ],
      en: [
        'Create your BIO page in a few steps:',
        '1. Sign in and open the Dashboard.',
        '2. Choose "Edit profile" to enter your username (lowercase letters and numbers), display name, bio, avatar and background.',
        '3. Add your social links or website.',
        '4. Open "Edit layout" or pick a template to customize the layout.',
        '5. Save. Your page gets a shareable address like konone/your-username.',
      ],
    },
    links: [
      { to: '/edit-profile', label: { vi: 'Chỉnh sửa hồ sơ', en: 'Edit profile' } },
      { to: '/edit-layout', label: { vi: 'Chỉnh sửa bố cục', en: 'Edit layout' } },
    ],
  },
  {
    id: 'register',
    label: { vi: 'Hướng dẫn đăng ký tài khoản', en: 'How to sign up' },
    answer: {
      vi: [
        'Đăng ký tài khoản KonOne:',
        '1. Mở trang Đăng ký, nhập email và mật khẩu (tối thiểu 6 ký tự), hoặc đăng nhập nhanh bằng Google / GitHub.',
        '2. Chúng tôi gửi mã xác thực 6 số đến email của bạn.',
        '3. Nhập mã ở trang xác thực. Mã có hiệu lực 10 phút.',
        '4. Xong! Bạn có thể vào Dashboard và tạo trang BIO.',
      ],
      en: [
        'Sign up for KonOne:',
        '1. Open the Register page and enter your email and a password (at least 6 characters), or sign in quickly with Google / GitHub.',
        '2. We email you a 6-digit verification code.',
        '3. Enter the code on the verification page. It is valid for 10 minutes.',
        '4. Done! You can open the Dashboard and create your BIO page.',
      ],
    },
    links: [
      { to: '/register', label: { vi: 'Đăng ký ngay', en: 'Sign up now' } },
      { to: '/login', label: { vi: 'Đăng nhập', en: 'Sign in' } },
    ],
  },
  {
    id: 'otp',
    label: { vi: 'Không nhận được mã xác thực', en: "I didn't get the verification code" },
    answer: {
      vi: [
        'Nếu chưa thấy mã xác thực:',
        '• Kiểm tra thư mục Spam / Junk (Thư rác) và tab Quảng cáo.',
        '• Đợi 1–2 phút rồi bấm "Gửi lại mã" (có thể gửi lại sau 60 giây).',
        '• Mã hết hạn sau 10 phút và chỉ được nhập sai tối đa vài lần; nếu quá, hãy gửi mã mới.',
        '• Kiểm tra bạn đã nhập đúng địa chỉ email.',
        `Vẫn không được? Liên hệ ${SUPPORT_EMAIL}.`,
      ],
      en: [
        "If you can't find the code:",
        '• Check your Spam / Junk folder and the Promotions tab.',
        '• Wait 1–2 minutes, then tap "Resend code" (available after 60 seconds).',
        '• The code expires after 10 minutes and only allows a few wrong attempts; if exceeded, request a new one.',
        '• Make sure you entered the correct email address.',
        `Still stuck? Contact ${SUPPORT_EMAIL}.`,
      ],
    },
    links: [{ to: '/verify-email', label: { vi: 'Trang xác thực', en: 'Verification page' } }],
  },
  {
    id: 'privacy',
    label: { vi: 'Chính sách bảo mật', en: 'Privacy Policy' },
    answer: {
      vi: [
        'Tóm tắt chính sách bảo mật của KonOne:',
        '• Chỉ thu thập dữ liệu cần thiết: email, nội dung hồ sơ và số liệu sử dụng cơ bản.',
        '• Dữ liệu được mã hóa khi truyền (HTTPS/TLS) và khi lưu trữ.',
        '• Mật khẩu được lưu dạng băm, chúng tôi không thấy mật khẩu gốc.',
        '• Xây dựng trên hạ tầng toàn cầu như Google Firebase, Vercel, Cloudinary.',
        '• Chúng tôi không bán dữ liệu cá nhân của bạn.',
      ],
      en: [
        'KonOne privacy summary:',
        '• We collect only what is needed: email, profile content and basic usage data.',
        '• Data is encrypted in transit (HTTPS/TLS) and at rest.',
        '• Passwords are stored hashed; we never see your plain-text password.',
        '• Built on global infrastructure such as Google Firebase, Vercel and Cloudinary.',
        '• We do not sell your personal data.',
      ],
    },
    links: [{ to: '/privacy', label: { vi: 'Đọc chính sách đầy đủ', en: 'Read the full policy' } }],
  },
  {
    id: 'terms',
    label: { vi: 'Điều khoản dịch vụ', en: 'Terms of Service' },
    answer: {
      vi: [
        'Điều khoản dịch vụ quy định cách sử dụng KonOne: trách nhiệm với tài khoản, quy định nội dung được phép đăng, quyền sở hữu nội dung của bạn, thanh toán Premium và các trường hợp tạm ngưng tài khoản.',
      ],
      en: [
        'The Terms of Service cover how to use KonOne: account responsibilities, acceptable content, ownership of your content, Premium payments and when accounts may be suspended.',
      ],
    },
    links: [{ to: '/terms', label: { vi: 'Đọc điều khoản', en: 'Read the terms' } }],
  },
  {
    id: 'copyright',
    label: { vi: 'Chính sách bản quyền', en: 'Copyright Policy' },
    answer: {
      vi: [
        'KonOne tôn trọng quyền sở hữu trí tuệ. Nội dung bạn đăng vẫn thuộc về bạn, và bạn chỉ nên tải lên tư liệu mình có quyền sử dụng.',
        `Nếu thấy nội dung xâm phạm bản quyền của mình, hãy gửi báo cáo đến ${LEGAL_EMAIL}.`,
      ],
      en: [
        'KonOne respects intellectual property. Content you post stays yours, and you should only upload material you have the right to use.',
        `If you find content that infringes your copyright, send a report to ${LEGAL_EMAIL}.`,
      ],
    },
    links: [{ to: '/copyright', label: { vi: 'Đọc chính sách bản quyền', en: 'Read the copyright policy' } }],
  },
  {
    id: 'premium',
    label: { vi: 'Premium & mã đổi (redeem code)', en: 'Premium & redeem codes' },
    answer: {
      vi: [
        'Premium mở khóa thêm tính năng tùy biến cho trang BIO của bạn.',
        'Bạn có thể mua gói Premium hoặc nhập mã đổi (redeem code) ở trang Premium. Mỗi mã chỉ dùng một lần.',
      ],
      en: [
        'Premium unlocks extra customization for your BIO page.',
        'You can buy a Premium plan or enter a redeem code on the Premium page. Each code can be used once.',
      ],
    },
    links: [{ to: '/premium', label: { vi: 'Đến trang Premium', en: 'Go to Premium' } }],
  },
  {
    id: 'contact',
    label: { vi: 'Liên hệ hỗ trợ', en: 'Contact support' },
    answer: {
      vi: [`Bạn có thể email cho đội ngũ hỗ trợ tại ${SUPPORT_EMAIL}. Chúng tôi sẽ phản hồi sớm nhất có thể.`],
      en: [`You can email our support team at ${SUPPORT_EMAIL}. We will get back to you as soon as possible.`],
    },
    links: [],
  },
];

export const UI = {
  vi: {
    title: 'Trợ lý KonOne',
    subtitle: 'Chọn một mục để được hướng dẫn',
    greeting: 'Xin chào! 👋 Mình có thể giúp gì cho bạn? Hãy chọn một mục bên dưới.',
    placeholder: 'Nhập câu hỏi của bạn...',
    send: 'Gửi',
    others: 'Chọn mục khác:',
    fallback: 'Mình chưa hiểu câu hỏi này (trợ lý AI sẽ sớm ra mắt). Bạn hãy chọn một trong các mục dưới đây nhé.',
    open: 'Mở khung chat',
    close: 'Đóng khung chat',
  },
  en: {
    title: 'KonOne Assistant',
    subtitle: 'Pick a topic to get help',
    greeting: 'Hi! 👋 How can I help you? Please choose a topic below.',
    placeholder: 'Type your question...',
    send: 'Send',
    others: 'Other topics:',
    fallback: "I didn't understand that (the AI assistant is coming soon). Please pick one of the topics below.",
    open: 'Open chat',
    close: 'Close chat',
  },
};

// Tìm chủ đề khớp với câu người dùng gõ (so khớp từ khóa đơn giản, tạm thời khi chưa có AI)
const KEYWORDS = {
  bio: ['bio', 'tạo trang', 'hồ sơ', 'profile', 'create'],
  register: ['đăng ký', 'dang ky', 'register', 'sign up', 'signup', 'tài khoản', 'account'],
  otp: ['mã', 'otp', 'code', 'xác thực', 'verify', 'verification', 'spam'],
  privacy: ['bảo mật', 'riêng tư', 'privacy', 'security', 'dữ liệu', 'data'],
  terms: ['điều khoản', 'terms'],
  copyright: ['bản quyền', 'copyright', 'dmca'],
  premium: ['premium', 'redeem', 'thanh toán', 'payment', 'mua'],
  contact: ['liên hệ', 'hỗ trợ', 'contact', 'support', 'email'],
};

function matchTopic(text) {
  const q = text.toLowerCase();
  for (const [id, words] of Object.entries(KEYWORDS)) {
    if (words.some((w) => q.includes(w))) return TOPICS.find((t) => t.id === id);
  }
  return null;
}

// Trả lời cho một tin nhắn. Hiện dùng câu trả lời có sẵn; sau này thay bằng gọi API AI.
// topicId: có giá trị khi người dùng bấm chọn một mục; text: câu người dùng tự gõ.
export async function getReply({ topicId, text, lang }) {
  const topic = topicId ? TOPICS.find((t) => t.id === topicId) : matchTopic(text || '');
  if (!topic) {
    return { lines: [UI[lang].fallback], links: [], matched: false };
  }
  return {
    lines: topic.answer[lang],
    links: topic.links.map((l) => ({ to: l.to, label: l.label[lang] })),
    matched: true,
  };
}
