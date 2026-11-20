import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import AnimatedContent from './AnimatedContent';

export default function HomeFaq() {
  const { language } = useLanguage();
  const L = (vi, en) => (language === 'vi' ? vi : en);
  const [open, setOpen] = useState(0);

  const items = [
    {
      q: L('KonOne là gì?', 'What is KonOne?'),
      a: L(
        'KonOne là nền tảng link-in-bio giúp bạn gom mọi thứ mình làm vào một trang gọn gàng, dễ tùy biến. Chỉ với một đường link, bạn chia sẻ được cả thế giới của mình.',
        'KonOne is a link-in-bio platform that gathers everything you do into one clean, customizable page. With a single link, you can share your whole world.'
      )
    },
    {
      q: L('KonOne có miễn phí không?', 'Is KonOne free?'),
      a: L(
        'Có. Gói FREE dùng trọn đời với các tính năng cơ bản, bao gồm tối đa 3 liên kết. Khi cần thêm bố cục, hiệu ứng và tùy chỉnh nâng cao, bạn có thể nâng cấp lên PREMIUM.',
        'Yes. The FREE plan is yours for life with the core features, including up to 3 links. When you need more layouts, effects and advanced customization, you can upgrade to PREMIUM.'
      )
    },
    {
      q: L('KonOne có an toàn không?', 'Is KonOne safe?'),
      a: L(
        'Có. Tài khoản được xác thực email bằng mã OTP, dữ liệu tài khoản của bạn chỉ chính bạn truy cập được, và chỉ những thông tin bạn đặt trên hồ sơ mới hiển thị công khai. Bạn có thể xem chi tiết trong Chính sách bảo mật của chúng tôi.',
        'Yes. Accounts are verified by email with an OTP code, your account data is only accessible to you, and only what you put on your profile is shown publicly. You can read the details in our Privacy Policy.'
      )
    },
    {
      q: L('Tôi có thể làm gì với KonOne?', 'What can I do with KonOne?'),
      a: L(
        'Bạn có thể thêm mạng xã hội và liên kết riêng, tùy chỉnh giao diện hồ sơ, theo dõi lượt xem và xuất hiện trên bảng xếp hạng. Gói PREMIUM mở thêm bố cục, phông chữ, hiệu ứng gõ chữ và nhiều hiệu ứng đặc biệt khác.',
        'You can add social networks and custom links, customize how your profile looks, track views and show up on the leaderboard. PREMIUM unlocks extra layouts, fonts, typewriter effects and more special effects.'
      )
    },
    {
      q: L('Làm sao để có link konone.fun/tên-của-bạn?', 'How do I get my konone.fun/your-name link?'),
      a: L(
        'Nhập tên bạn muốn vào thanh link ở đầu trang rồi đăng ký tài khoản. Sau khi tạo hồ sơ, đường link của bạn sẽ có dạng konone.fun/tên-của-bạn.',
        'Type the name you want into the link bar at the top of the page, then sign up. Once your profile is created, your link will look like konone.fun/your-name.'
      )
    },
    {
      q: L('Làm sao kích hoạt PREMIUM?', 'How do I activate PREMIUM?'),
      a: L(
        'Đăng nhập, vào trang Premium và nhập mã kích hoạt của bạn. Gói sẽ được áp dụng cho hồ sơ ngay sau khi mã hợp lệ.',
        'Log in, open the Premium page and enter your activation code. The plan is applied to your profile as soon as the code is valid.'
      )
    }
  ];

  return (
    <div className="hf">
      <AnimatedContent distance={60} duration={0.8} ease="power3.out" threshold={0.1}>
        <h2 className="hf-title">{L('Bạn nên biết', 'Good to know')}</h2>
        <p className="hf-sub">
          {L('Chúng tôi rất tôn trọng quyền lợi và sự an toàn của bạn.', 'We deeply respect your rights and your safety.')}
        </p>
      </AnimatedContent>

      <AnimatedContent distance={70} duration={0.8} ease="power3.out" stagger={0.08} threshold={0.05} className="hf-list">
        {items.map((item, i) => {
          const isOpen = open === i;
          return (
            <div className={`hf-item${isOpen ? ' open' : ''}`} key={item.q}>
              <button
                type="button"
                className="hf-q"
                aria-expanded={isOpen}
                aria-controls={`hf-a-${i}`}
                onClick={() => setOpen(isOpen ? -1 : i)}
              >
                <span>{item.q}</span>
                <svg className="hf-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              <div className="hf-a-wrap" id={`hf-a-${i}`} role="region">
                <div className="hf-a-inner">
                  <p className="hf-a">{item.a}</p>
                </div>
              </div>
            </div>
          );
        })}
      </AnimatedContent>
    </div>
  );
}
