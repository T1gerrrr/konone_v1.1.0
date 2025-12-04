# Hướng dẫn cấu hình Email Verification

## Tính năng đã thêm

Ứng dụng đã được tích hợp xác thực email tự động khi đăng ký. Firebase sẽ gửi email xác thực (không phải OTP) với link để người dùng click vào.

## Cách hoạt động

1. **Khi đăng ký:**
   - Người dùng nhập email và password
   - Tài khoản được tạo
   - Firebase tự động gửi email xác thực đến địa chỉ email đã đăng ký
   - Hiển thị thông báo yêu cầu kiểm tra email

2. **Email xác thực:**
   - Người dùng mở email từ Firebase
   - Click vào link "Verify email" trong email
   - Email được xác thực tự động

3. **Gửi lại email:**
   - Nếu không nhận được email, có thể click nút "Gửi lại email"

## Cấu hình Firebase

### Bước 1: Bật Email Verification trong Firebase Console

1. Vào https://console.firebase.google.com
2. Chọn project: **khoatk-user-app**
3. Vào **Authentication** → **Settings** → **Templates**
4. Chọn **Email address verification**
5. Có thể tùy chỉnh template email (tùy chọn)

### Bước 2: Cấu hình Email Template (Tùy chọn)

Firebase cung cấp template mặc định, nhưng bạn có thể tùy chỉnh:

1. Trong **Email address verification** template
2. Có thể thay đổi:
   - Subject (Tiêu đề email)
   - Body (Nội dung email)
   - Action URL (URL xác thực - mặc định là Firebase)

### Bước 3: Cấu hình Authorized domains

1. Vào **Authentication** → **Settings** → **Authorized domains**
2. Đảm bảo domain của bạn đã được thêm vào
3. Firebase tự động thêm:
   - `localhost` (cho development)
   - Domain của project (ví dụ: `khoatk-user-app.firebaseapp.com`)

## Kiểm tra Email Verification Status

Trong code, bạn có thể kiểm tra email đã được xác thực chưa:

```javascript
import { useAuth } from '../contexts/AuthContext';

const { currentUser } = useAuth();

if (currentUser) {
  console.log('Email verified:', currentUser.emailVerified);
}
```

## Lưu ý

- Firebase gửi email từ `noreply@[project-id].firebaseapp.com`
- Email có thể vào thư mục Spam/Junk
- Link xác thực có thời hạn (mặc định là 3 ngày)
- Có thể gửi lại email xác thực nhiều lần
- Email verification không bắt buộc để đăng nhập, nhưng nên khuyến khích người dùng xác thực

## Tùy chỉnh Email Template

Bạn có thể tùy chỉnh email template trong Firebase Console:

1. Vào **Authentication** → **Templates**
2. Chọn **Email address verification**
3. Click **Edit**
4. Có thể thay đổi:
   - **Subject**: Tiêu đề email
   - **Message**: Nội dung email
   - Sử dụng biến: `%LINK%` (link xác thực), `%DISPLAY_NAME%` (tên hiển thị)

## Troubleshooting

### Email không được gửi
- Kiểm tra Spam/Junk folder
- Kiểm tra email đã nhập đúng chưa
- Đợi vài phút (có thể bị delay)
- Thử gửi lại email

### Link không hoạt động
- Link có thể đã hết hạn (3 ngày)
- Gửi lại email mới
- Kiểm tra domain được authorize chưa

### Email vào Spam
- Thêm `noreply@[project-id].firebaseapp.com` vào whitelist
- Hoặc cấu hình custom domain trong Firebase

