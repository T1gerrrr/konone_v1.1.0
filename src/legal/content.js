// Nội dung các trang pháp lý (song ngữ vi / en).
// Mỗi mục: { h: tiêu đề, p: [đoạn văn], ul: [gạch đầu dòng] }
// Lưu ý: đây là bản soạn thảo dựa trên cách hệ thống hiện đang hoạt động. Chủ sở hữu nên rà soát lại (và tham khảo luật sư nếu cần) trước khi coi là văn bản pháp lý chính thức.

export const LEGAL_UPDATED = '2026-11-19';
export const LEGAL_EMAIL = 'konone@gmail.com';
export const SUPPORT_EMAIL = 'support@konone.com';

export const LEGAL = {
  /* ===================================================== PRIVACY ===== */
  privacy: {
    en: {
      title: 'Privacy Policy',
      intro:
        'KonOne ("we", "us") lets you build customizable link-in-bio profile pages. This policy explains what data we collect, why we collect it, how we protect it, and the choices you have. We designed KonOne to collect only what it needs to run.',
      sections: [
        {
          h: '1. Information we collect',
          ul: [
            'Account data: your email address and a password (or the identity returned by Google / GitHub if you sign in with them).',
            'Profile content: username, display name, bio, links, images, backgrounds, music and layout settings you choose to add.',
            'Usage data: basic page-view counts for public profiles and anonymous analytics about how the site is used.',
            'Payment data: if you buy Premium, the payment is handled by the payment provider. We receive the order status, not your card or wallet credentials.',
            'Technical data: browser type, device and IP address, processed by our infrastructure providers for security and reliability.',
          ],
        },
        {
          h: '2. How we use your information',
          ul: [
            'To create and secure your account and verify your email address.',
            'To display your public profile at your chosen address.',
            'To provide features such as templates, layout editing, the community page and Premium.',
            'To prevent abuse, fraud and unauthorized access.',
            'To improve the product using aggregated, non-identifying analytics.',
          ],
          after: ['We do not sell your personal data, and we do not use it for third-party advertising.'],
        },
        {
          h: '3. Our commitment to security',
          p: [
            'Protecting your data is a core part of how KonOne is built. We apply the following measures:',
          ],
          ul: [
            'Encryption in transit: all traffic between your browser and KonOne uses HTTPS / TLS.',
            'Encryption at rest: data stored in our database and file storage is encrypted at rest by our cloud provider.',
            'Password protection: passwords are handled by Firebase Authentication and stored only as salted, hashed values. We never see or store your plain-text password.',
            'Email verification: new accounts are verified with a one-time 6-digit code that is stored only as a hash, expires after 10 minutes and is limited to a few attempts.',
            'Access control: database security rules ensure that users can modify only their own profile, and server-side secrets are never exposed to the browser.',
            'Least privilege: our servers use dedicated service credentials kept in protected environment variables.',
          ],
        },
        {
          h: '4. Global infrastructure and trusted platforms',
          p: [
            'KonOne is built on well-established global platforms so that your data benefits from the security investment of large providers:',
          ],
          ul: [
            'Google Firebase / Google Cloud — authentication, database, file storage and analytics.',
            'Vercel — web hosting, global content delivery and serverless functions.',
            'Cloudinary — image upload and delivery.',
            'Google (Gmail) — delivery of verification emails.',
            'Google and GitHub — optional sign-in with your existing account.',
            'MoMo — payment processing for Premium purchases.',
          ],
          after: [
            'These providers operate secure data centers and publish their own security and compliance programs (for example ISO 27001 and SOC 2 reports). Those certifications belong to the providers; they are not certifications of KonOne itself. Your data may be processed in countries other than your own, under the protections these providers offer.',
          ],
        },
        {
          h: '5. Sharing of information',
          p: ['We share data only in these cases:'],
          ul: [
            'With the service providers listed above, strictly to operate KonOne.',
            'Publicly, for content you choose to publish on your profile.',
            'When required by law, or to protect the rights, safety and security of KonOne and its users.',
          ],
        },
        {
          h: '6. Cookies and local storage',
          p: [
            'We use browser storage and similar technologies to keep you signed in, remember your language, and measure usage. You can clear this data at any time from your browser settings; some features may stop working if you do.',
          ],
        },
        {
          h: '7. Retention',
          p: [
            'We keep your data while your account is active. When you delete your account in Dashboard → Account, your login account, profile, links, settings and view statistics are deleted immediately and cannot be recovered. If you ask us to delete your data by email, we do so within 72 hours of receiving the request, in line with Decree 13/2023/ND-CP on personal data protection.',
            'After deletion we keep only a minimal record (a one-way hash of the account ID and the time of deletion, with no personal data) to prove the request was fulfilled, plus anything the law requires us to keep.',
          ],
        },
        {
          h: '8. Your rights',
          ul: [
            'Know and access your data: view it in the dashboard and download a copy as a JSON file in Dashboard → Account.',
            'Correct your data at any time in the profile editor.',
            'Delete your data: delete your account yourself in Dashboard → Account, or ask us to do it.',
            'Withdraw consent, or object to or restrict certain processing.',
            'Complain to us, or to the competent authority, about how your data is handled.',
          ],
          after: ['To exercise these rights by request, contact us using the details below. We respond within 72 hours.'],
        },
        {
          h: '9. Children',
          p: [
            'KonOne is not directed to children under 13 (or the minimum age required in your country). If you believe a child has given us personal data, contact us and we will delete it.',
          ],
        },
        {
          h: '10. Changes to this policy',
          p: [
            'We may update this policy from time to time. The "Last updated" date at the top shows the latest version. Significant changes will be announced on the site.',
          ],
        },
        {
          h: '11. Contact',
          p: ['Questions about privacy or security? Email us at {LEGAL_EMAIL}.'],
        },
      ],
    },
    vi: {
      title: 'Chính sách bảo mật',
      intro:
        'KonOne ("chúng tôi") cho phép bạn tạo trang hồ sơ liên kết (link-in-bio) tùy biến. Chính sách này giải thích chúng tôi thu thập dữ liệu gì, vì sao, bảo vệ như thế nào và bạn có những quyền gì. KonOne chỉ thu thập những gì cần thiết để vận hành.',
      sections: [
        {
          h: '1. Thông tin chúng tôi thu thập',
          ul: [
            'Dữ liệu tài khoản: địa chỉ email và mật khẩu (hoặc danh tính do Google / GitHub trả về nếu bạn đăng nhập bằng các dịch vụ này).',
            'Nội dung hồ sơ: tên người dùng, tên hiển thị, tiểu sử, liên kết, hình ảnh, ảnh nền, nhạc và cài đặt bố cục mà bạn tự thêm.',
            'Dữ liệu sử dụng: số lượt xem trang hồ sơ công khai và số liệu phân tích ẩn danh về cách sử dụng website.',
            'Dữ liệu thanh toán: khi mua Premium, giao dịch do bên cung cấp thanh toán xử lý. Chúng tôi chỉ nhận trạng thái đơn hàng, không nhận thông tin thẻ hoặc ví của bạn.',
            'Dữ liệu kỹ thuật: loại trình duyệt, thiết bị và địa chỉ IP, do các nhà cung cấp hạ tầng xử lý nhằm bảo mật và đảm bảo ổn định.',
          ],
        },
        {
          h: '2. Cách chúng tôi sử dụng thông tin',
          ul: [
            'Tạo và bảo vệ tài khoản, xác thực địa chỉ email của bạn.',
            'Hiển thị hồ sơ công khai của bạn tại địa chỉ bạn chọn.',
            'Cung cấp các tính năng như mẫu giao diện, chỉnh sửa bố cục, trang cộng đồng và Premium.',
            'Ngăn chặn lạm dụng, gian lận và truy cập trái phép.',
            'Cải thiện sản phẩm bằng số liệu phân tích tổng hợp, không định danh.',
          ],
          after: ['Chúng tôi không bán dữ liệu cá nhân của bạn và không dùng nó cho quảng cáo của bên thứ ba.'],
        },
        {
          h: '3. Cam kết bảo mật',
          p: ['Bảo vệ dữ liệu của bạn là nền tảng trong cách KonOne được xây dựng. Chúng tôi áp dụng các biện pháp sau:'],
          ul: [
            'Mã hóa khi truyền tải: toàn bộ kết nối giữa trình duyệt và KonOne dùng HTTPS / TLS.',
            'Mã hóa khi lưu trữ: dữ liệu trong cơ sở dữ liệu và kho tệp được nhà cung cấp đám mây mã hóa khi lưu trữ.',
            'Bảo vệ mật khẩu: mật khẩu do Firebase Authentication xử lý và chỉ được lưu dưới dạng giá trị băm có salt. Chúng tôi không bao giờ thấy hay lưu mật khẩu gốc của bạn.',
            'Xác thực email: tài khoản mới được xác thực bằng mã 6 số dùng một lần, chỉ lưu dưới dạng băm, hết hạn sau 10 phút và giới hạn số lần nhập sai.',
            'Kiểm soát truy cập: quy tắc bảo mật của cơ sở dữ liệu đảm bảo người dùng chỉ sửa được hồ sơ của chính mình; các khóa bí mật phía máy chủ không bao giờ lộ ra trình duyệt.',
            'Đặc quyền tối thiểu: máy chủ dùng thông tin xác thực riêng, lưu trong biến môi trường được bảo vệ.',
          ],
        },
        {
          h: '4. Hạ tầng toàn cầu và các nền tảng uy tín',
          p: ['KonOne được xây dựng trên các nền tảng toàn cầu đã được kiểm chứng, để dữ liệu của bạn hưởng lợi từ khoản đầu tư bảo mật của các nhà cung cấp lớn:'],
          ul: [
            'Google Firebase / Google Cloud — xác thực, cơ sở dữ liệu, lưu trữ tệp và phân tích.',
            'Vercel — lưu trữ web, mạng phân phối nội dung toàn cầu và hàm serverless.',
            'Cloudinary — tải lên và phân phối hình ảnh.',
            'Google (Gmail) — gửi email xác thực.',
            'Google và GitHub — đăng nhập tùy chọn bằng tài khoản có sẵn.',
            'MoMo — xử lý thanh toán khi mua Premium.',
          ],
          after: [
            'Các nhà cung cấp này vận hành trung tâm dữ liệu an toàn và tự công bố chương trình bảo mật, tuân thủ của họ (ví dụ báo cáo ISO 27001, SOC 2). Các chứng nhận đó thuộc về nhà cung cấp, không phải chứng nhận của riêng KonOne. Dữ liệu của bạn có thể được xử lý ở quốc gia khác với nơi bạn sống, theo các biện pháp bảo vệ mà các nhà cung cấp này áp dụng.',
          ],
        },
        {
          h: '5. Chia sẻ thông tin',
          p: ['Chúng tôi chỉ chia sẻ dữ liệu trong các trường hợp sau:'],
          ul: [
            'Với các nhà cung cấp dịch vụ nêu trên, chỉ nhằm vận hành KonOne.',
            'Công khai, đối với nội dung bạn chọn đăng trên hồ sơ.',
            'Khi pháp luật yêu cầu, hoặc để bảo vệ quyền lợi, an toàn và an ninh của KonOne và người dùng.',
          ],
        },
        {
          h: '6. Cookie và lưu trữ cục bộ',
          p: [
            'Chúng tôi dùng bộ nhớ trình duyệt và các công nghệ tương tự để giữ trạng thái đăng nhập, ghi nhớ ngôn ngữ và đo lường mức sử dụng. Bạn có thể xóa dữ liệu này bất cứ lúc nào trong cài đặt trình duyệt; một số tính năng có thể ngừng hoạt động nếu bạn xóa.',
          ],
        },
        {
          h: '7. Thời gian lưu trữ',
          p: [
            'Chúng tôi lưu dữ liệu trong thời gian tài khoản còn hoạt động. Khi bạn tự xóa tài khoản tại Bảng điều khiển → Tài khoản, tài khoản đăng nhập, hồ sơ, liên kết, cài đặt và thống kê lượt xem sẽ bị xóa ngay và không thể khôi phục. Nếu bạn gửi yêu cầu xóa qua email, chúng tôi thực hiện trong vòng 72 giờ kể từ khi nhận được yêu cầu, theo Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.',
            'Sau khi xóa, chúng tôi chỉ giữ một bản ghi tối thiểu (mã băm một chiều của mã tài khoản và thời điểm xóa, không chứa dữ liệu cá nhân) để chứng minh yêu cầu đã được thực hiện, cùng những gì pháp luật bắt buộc phải lưu.',
          ],
        },
        {
          h: '8. Quyền của bạn',
          ul: [
            'Được biết và truy cập dữ liệu: xem trong trang quản lý và tải bản sao dạng tệp JSON tại Bảng điều khiển → Tài khoản.',
            'Chỉnh sửa dữ liệu bất cứ lúc nào trong trình chỉnh sửa hồ sơ.',
            'Xóa dữ liệu: tự xóa tài khoản tại Bảng điều khiển → Tài khoản, hoặc yêu cầu chúng tôi xóa.',
            'Rút lại sự đồng ý, phản đối hoặc yêu cầu hạn chế một số hoạt động xử lý dữ liệu.',
            'Khiếu nại với chúng tôi hoặc cơ quan có thẩm quyền về việc xử lý dữ liệu của bạn.',
          ],
          after: ['Để thực hiện các quyền này theo hình thức gửi yêu cầu, vui lòng liên hệ theo thông tin bên dưới. Chúng tôi phản hồi trong vòng 72 giờ.'],
        },
        {
          h: '9. Trẻ em',
          p: [
            'KonOne không dành cho trẻ em dưới 13 tuổi (hoặc độ tuổi tối thiểu theo quy định ở nước bạn). Nếu bạn cho rằng trẻ em đã cung cấp dữ liệu cá nhân cho chúng tôi, hãy liên hệ để chúng tôi xóa.',
          ],
        },
        {
          h: '10. Thay đổi chính sách',
          p: [
            'Chúng tôi có thể cập nhật chính sách theo thời gian. Ngày "Cập nhật lần cuối" ở đầu trang cho biết phiên bản mới nhất. Các thay đổi quan trọng sẽ được thông báo trên website.',
          ],
        },
        {
          h: '11. Liên hệ',
          p: ['Có câu hỏi về quyền riêng tư hoặc bảo mật? Hãy email cho chúng tôi tại {LEGAL_EMAIL}.'],
        },
      ],
    },
  },

  /* ======================================================== TERMS ===== */
  terms: {
    en: {
      title: 'Terms of Service',
      intro:
        'Welcome to KonOne. By creating an account or using the service you agree to these Terms. If you do not agree, please do not use KonOne.',
      sections: [
        {
          h: '1. The service',
          p: ['KonOne lets you create, customize and share link-in-bio profile pages, and discover other profiles in the community. We may add, change or remove features over time.'],
        },
        {
          h: '2. Your account',
          ul: [
            'You must provide accurate information and verify your email address.',
            'You are responsible for keeping your password secure and for all activity under your account.',
            'You must be old enough to form a binding agreement in your country, and at least 13 years old.',
            'Tell us promptly if you suspect unauthorized access to your account.',
          ],
        },
        {
          h: '3. Acceptable use',
          p: ['You agree not to use KonOne to:'],
          ul: [
            'Publish content that is illegal, hateful, harassing, sexually exploitative of minors, or that promotes violence.',
            'Impersonate another person or organization, or mislead others about who you are.',
            'Distribute malware, phishing links or content designed to defraud or harm users.',
            'Infringe intellectual property or privacy rights of others.',
            'Probe, scrape, overload or attempt to bypass the security of the service.',
            'Create accounts or usernames for spam, resale or squatting.',
          ],
        },
        {
          h: '4. Your content',
          p: [
            'You keep ownership of the content you publish. You grant KonOne a worldwide, non-exclusive, royalty-free license to host, display and distribute that content solely to operate and promote the service (for example showing your profile and listing it in the community). You are responsible for having the rights to everything you upload.',
          ],
        },
        {
          h: '5. Premium and payments',
          ul: [
            'Premium features are offered under the plans and prices shown at the time of purchase.',
            'Payments are processed by third-party providers; we do not store your card or wallet credentials.',
            'Unless required by law or stated otherwise at purchase, payments are non-refundable once a plan or code has been activated.',
            'Redeem codes are for single use and may not be resold.',
          ],
        },
        {
          h: '6. Suspension and termination',
          p: ['We may suspend or remove content or accounts that violate these Terms or put the service or other users at risk. You may stop using KonOne and delete your account at any time.'],
        },
        {
          h: '7. Third-party services',
          p: ['KonOne relies on third-party platforms and may link to external sites. We are not responsible for the content or practices of third parties, and their own terms apply when you use them.'],
        },
        {
          h: '8. Disclaimer',
          p: ['KonOne is provided "as is" and "as available". We work to keep it secure and reliable, but we cannot guarantee uninterrupted or error-free operation.'],
        },
        {
          h: '9. Limitation of liability',
          p: ['To the maximum extent permitted by law, KonOne and its operators are not liable for indirect, incidental or consequential damages, or for loss of data or profits, arising from your use of the service.'],
        },
        {
          h: '10. Changes to these Terms',
          p: ['We may update these Terms. Continued use of KonOne after an update means you accept the new Terms. The "Last updated" date shows the latest version.'],
        },
        {
          h: '11. Contact',
          p: ['Questions about these Terms? Email {LEGAL_EMAIL}.'],
        },
      ],
    },
    vi: {
      title: 'Điều khoản dịch vụ',
      intro:
        'Chào mừng bạn đến với KonOne. Khi tạo tài khoản hoặc sử dụng dịch vụ, bạn đồng ý với các Điều khoản này. Nếu không đồng ý, vui lòng không sử dụng KonOne.',
      sections: [
        {
          h: '1. Dịch vụ',
          p: ['KonOne cho phép bạn tạo, tùy biến và chia sẻ trang hồ sơ liên kết (link-in-bio), đồng thời khám phá các hồ sơ khác trong cộng đồng. Chúng tôi có thể thêm, thay đổi hoặc gỡ bỏ tính năng theo thời gian.'],
        },
        {
          h: '2. Tài khoản của bạn',
          ul: [
            'Bạn phải cung cấp thông tin chính xác và xác thực địa chỉ email.',
            'Bạn chịu trách nhiệm giữ an toàn mật khẩu và mọi hoạt động diễn ra trên tài khoản.',
            'Bạn phải đủ tuổi để giao kết thỏa thuận theo luật nước bạn và tối thiểu 13 tuổi.',
            'Hãy báo ngay cho chúng tôi nếu nghi ngờ tài khoản bị truy cập trái phép.',
          ],
        },
        {
          h: '3. Quy định sử dụng',
          p: ['Bạn đồng ý không sử dụng KonOne để:'],
          ul: [
            'Đăng nội dung vi phạm pháp luật, thù ghét, quấy rối, bóc lột tình dục trẻ em hoặc cổ xúy bạo lực.',
            'Mạo danh cá nhân hoặc tổ chức khác, hoặc đánh lừa người khác về danh tính của bạn.',
            'Phát tán mã độc, liên kết lừa đảo hoặc nội dung nhằm gian lận, gây hại cho người dùng.',
            'Xâm phạm quyền sở hữu trí tuệ hoặc quyền riêng tư của người khác.',
            'Dò quét, thu thập dữ liệu hàng loạt, gây quá tải hoặc tìm cách vượt qua cơ chế bảo mật của dịch vụ.',
            'Tạo tài khoản hoặc tên người dùng để spam, bán lại hoặc chiếm giữ.',
          ],
        },
        {
          h: '4. Nội dung của bạn',
          p: [
            'Bạn giữ quyền sở hữu nội dung mình đăng. Bạn cấp cho KonOne giấy phép toàn cầu, không độc quyền, miễn phí bản quyền để lưu trữ, hiển thị và phân phối nội dung đó, chỉ nhằm vận hành và quảng bá dịch vụ (ví dụ hiển thị hồ sơ và đưa vào trang cộng đồng). Bạn chịu trách nhiệm đảm bảo mình có quyền đối với mọi thứ tải lên.',
          ],
        },
        {
          h: '5. Premium và thanh toán',
          ul: [
            'Tính năng Premium được cung cấp theo gói và mức giá hiển thị tại thời điểm mua.',
            'Thanh toán do bên thứ ba xử lý; chúng tôi không lưu thông tin thẻ hoặc ví của bạn.',
            'Trừ khi pháp luật yêu cầu hoặc có nêu khác khi mua, khoản thanh toán không được hoàn lại sau khi gói hoặc mã đã được kích hoạt.',
            'Mã đổi (redeem code) chỉ dùng một lần và không được bán lại.',
          ],
        },
        {
          h: '6. Tạm ngưng và chấm dứt',
          p: ['Chúng tôi có thể tạm ngưng hoặc gỡ nội dung, tài khoản vi phạm Điều khoản hoặc gây rủi ro cho dịch vụ và người dùng khác. Bạn có thể ngừng sử dụng KonOne và xóa tài khoản bất cứ lúc nào.'],
        },
        {
          h: '7. Dịch vụ của bên thứ ba',
          p: ['KonOne dựa trên các nền tảng của bên thứ ba và có thể liên kết đến website bên ngoài. Chúng tôi không chịu trách nhiệm về nội dung hay hoạt động của bên thứ ba; điều khoản riêng của họ áp dụng khi bạn sử dụng.'],
        },
        {
          h: '8. Tuyên bố miễn trừ',
          p: ['KonOne được cung cấp "nguyên trạng" và "tùy khả năng đáp ứng". Chúng tôi nỗ lực giữ dịch vụ an toàn và ổn định nhưng không thể đảm bảo vận hành liên tục hoặc không có lỗi.'],
        },
        {
          h: '9. Giới hạn trách nhiệm',
          p: ['Trong phạm vi tối đa pháp luật cho phép, KonOne và đơn vị vận hành không chịu trách nhiệm cho thiệt hại gián tiếp, ngẫu nhiên hoặc hệ quả, hoặc mất dữ liệu, lợi nhuận phát sinh từ việc bạn sử dụng dịch vụ.'],
        },
        {
          h: '10. Thay đổi Điều khoản',
          p: ['Chúng tôi có thể cập nhật các Điều khoản này. Việc tiếp tục sử dụng KonOne sau khi cập nhật nghĩa là bạn chấp nhận Điều khoản mới. Ngày "Cập nhật lần cuối" cho biết phiên bản mới nhất.'],
        },
        {
          h: '11. Liên hệ',
          p: ['Có câu hỏi về Điều khoản? Hãy email {LEGAL_EMAIL}.'],
        },
      ],
    },
  },

  /* ===================================================== COPYRIGHT ===== */
  copyright: {
    en: {
      title: 'Copyright Policy',
      intro:
        'KonOne respects the intellectual property of others and expects its users to do the same. This policy explains how we handle copyright and how to report content you believe infringes your rights.',
      sections: [
        {
          h: '1. Ownership',
          p: [
            'The KonOne name, logo, website design, templates and software are owned by KonOne or its licensors and are protected by copyright and other laws. You may not copy, resell or reuse them without permission, except as the service allows.',
            'Content that you publish on your profile remains yours (see our Terms of Service).',
          ],
        },
        {
          h: '2. Your responsibility',
          p: ['Only upload or link to images, music, videos, fonts and other material that you own or have permission to use. Content that infringes someone else\'s rights may be removed.'],
        },
        {
          h: '3. Reporting infringement',
          p: ['If you are a rights holder (or authorized to act for one) and believe content on KonOne infringes your copyright, email {LEGAL_EMAIL} with:'],
          ul: [
            'A description of the copyrighted work you claim is infringed.',
            'The URL of the KonOne page or content you want reviewed.',
            'Your name, contact details and relationship to the work.',
            'A statement that you believe in good faith that the use is not authorized by the rights holder, its agent or the law.',
            'A statement that the information is accurate and that you are authorized to act on the rights holder\'s behalf.',
            'Your electronic or physical signature.',
          ],
        },
        {
          h: '4. What we do',
          p: ['We review complete notices promptly. Where appropriate we may remove or disable access to the content and notify the user who posted it. Submitting a knowingly false notice may have legal consequences.'],
        },
        {
          h: '5. Counter-notice',
          p: ['If your content was removed and you believe this was a mistake or that you have the right to use it, you may reply to us at {LEGAL_EMAIL} explaining why. We may restore the content if the issue is resolved or the rights holder does not pursue it.'],
        },
        {
          h: '6. Repeat infringers',
          p: ['Accounts that repeatedly infringe copyright may be suspended or terminated.'],
        },
      ],
    },
    vi: {
      title: 'Chính sách bản quyền',
      intro:
        'KonOne tôn trọng quyền sở hữu trí tuệ của người khác và mong người dùng cũng vậy. Chính sách này giải thích cách chúng tôi xử lý bản quyền và cách báo cáo nội dung bạn cho rằng xâm phạm quyền của mình.',
      sections: [
        {
          h: '1. Quyền sở hữu',
          p: [
            'Tên KonOne, logo, thiết kế website, các mẫu giao diện và phần mềm thuộc sở hữu của KonOne hoặc bên cấp phép và được bảo vệ bởi luật bản quyền cùng các luật liên quan. Bạn không được sao chép, bán lại hoặc tái sử dụng khi chưa được phép, ngoại trừ trong phạm vi dịch vụ cho phép.',
            'Nội dung bạn đăng trên hồ sơ vẫn thuộc về bạn (xem Điều khoản dịch vụ).',
          ],
        },
        {
          h: '2. Trách nhiệm của bạn',
          p: ['Chỉ tải lên hoặc liên kết đến hình ảnh, nhạc, video, phông chữ và tư liệu khác mà bạn sở hữu hoặc được phép sử dụng. Nội dung xâm phạm quyền của người khác có thể bị gỡ bỏ.'],
        },
        {
          h: '3. Báo cáo vi phạm',
          p: ['Nếu bạn là chủ sở hữu quyền (hoặc được ủy quyền) và cho rằng nội dung trên KonOne xâm phạm bản quyền của bạn, hãy email {LEGAL_EMAIL} kèm theo:'],
          ul: [
            'Mô tả tác phẩm có bản quyền mà bạn cho là bị xâm phạm.',
            'URL của trang hoặc nội dung trên KonOne cần xem xét.',
            'Họ tên, thông tin liên hệ và mối quan hệ của bạn với tác phẩm.',
            'Tuyên bố bạn tin tưởng một cách thiện chí rằng việc sử dụng đó không được chủ sở hữu, đại diện của họ hoặc pháp luật cho phép.',
            'Tuyên bố thông tin là chính xác và bạn được ủy quyền hành động thay mặt chủ sở hữu.',
            'Chữ ký điện tử hoặc chữ ký trực tiếp của bạn.',
          ],
        },
        {
          h: '4. Cách chúng tôi xử lý',
          p: ['Chúng tôi xem xét kịp thời các thông báo đầy đủ. Khi phù hợp, chúng tôi có thể gỡ hoặc vô hiệu hóa truy cập nội dung và thông báo cho người đăng. Gửi thông báo sai sự thật có chủ ý có thể phát sinh hậu quả pháp lý.'],
        },
        {
          h: '5. Phản hồi (counter-notice)',
          p: ['Nếu nội dung của bạn bị gỡ và bạn cho rằng đó là nhầm lẫn hoặc bạn có quyền sử dụng, hãy phản hồi tại {LEGAL_EMAIL} kèm lý do. Chúng tôi có thể khôi phục nội dung nếu vấn đề được giải quyết hoặc chủ sở hữu không theo đuổi.'],
        },
        {
          h: '6. Vi phạm lặp lại',
          p: ['Tài khoản vi phạm bản quyền nhiều lần có thể bị tạm ngưng hoặc chấm dứt.'],
        },
      ],
    },
  },
};
