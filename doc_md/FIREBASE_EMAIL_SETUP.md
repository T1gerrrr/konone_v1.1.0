# Hướng dẫn cấu hình Email Verification trong Firebase

## Vấn đề: Email không được gửi

Nếu email không được gửi, hãy kiểm tra các bước sau:

## Bước 1: Kiểm tra Firebase Console

1. Vào https://console.firebase.google.com
2. Chọn project: **khoatk-user-app**
3. Vào **Authentication** → **Settings**

## Bước 2: Kiểm tra Authorized domains

1. Trong **Settings**, scroll xuống phần **Authorized domains**
2. Đảm bảo có các domain sau:
   - `localhost` (cho development)
   - `khoatk-user-app.firebaseapp.com`
   - Domain của bạn (nếu deploy)

## Bước 3: Kiểm tra Email Templates

1. Vào **Authentication** → **Templates**
2. Kiểm tra **Email address verification** template
3. Đảm bảo template đã được bật (enabled)
4. Có thể preview email để xem nội dung

## Bước 4: Kiểm tra Email Provider

1. Vào **Authentication** → **Settings** → **Users**
2. Firebase tự động sử dụng email provider mặc định
3. Không cần cấu hình thêm nếu dùng Firebase mặc định

## Bước 5: Kiểm tra Console Logs

Mở Developer Console (F12) và kiểm tra:
- Có lỗi nào không?
- Message "Sending verification email to: ..."
- Message "Verification email sent successfully"

## Bước 6: Kiểm tra Email

1. **Kiểm tra Spam/Junk folder** - Email có thể bị filter
2. **Đợi vài phút** - Email có thể bị delay
3. **Kiểm tra email đúng chưa** - Đảm bảo email đã nhập đúng
4. **Email từ**: `noreply@khoatk-user-app.firebaseapp.com`

## Bước 7: Test với Email thật

Firebase có thể không gửi email đến:
- Email test/fake
- Email không tồn tại
- Một số email provider có thể block

## Bước 8: Kiểm tra Quota

Firebase free tier có giới hạn:
- 100 emails/ngày cho email verification
- Nếu vượt quá, email sẽ không được gửi

## Troubleshooting

### Lỗi: "auth/too-many-requests"
- Đã gửi quá nhiều email
- Đợi vài phút rồi thử lại

### Lỗi: "auth/invalid-email"
- Email không hợp lệ
- Kiểm tra format email

### Email không đến
1. Kiểm tra Spam folder
2. Thử email khác (Gmail, Outlook)
3. Kiểm tra console logs
4. Đợi 5-10 phút

### Gửi lại email
- Click nút "Gửi lại email" trong trang đăng ký
- Hoặc vào Dashboard và gửi lại từ đó

## Cấu hình Custom Email Domain (Nâng cao)

Nếu muốn dùng domain riêng để gửi email:

1. Vào **Authentication** → **Settings** → **Authorized domains**
2. Thêm custom domain
3. Cấu hình DNS records theo hướng dẫn của Firebase
4. Verify domain

## Test Email Verification

1. Đăng ký với email thật (Gmail, Outlook)
2. Kiểm tra inbox và spam folder
3. Click link "Verify email" trong email
4. Email sẽ được xác thực tự động

## Lưu ý quan trọng

- Firebase gửi email **tự động** khi gọi `sendEmailVerification()`
- Không cần cấu hình SMTP hay email server
- Email có thể mất 1-5 phút để đến
- Link xác thực có thời hạn 3 ngày
- Có thể gửi lại email nhiều lần

## Kiểm tra trong Code

Mở Console (F12) và xem logs:
```
Sending verification email to: user@example.com
Verification email sent successfully
```

Nếu thấy lỗi, sẽ hiển thị:
```
Error sending verification email: [error details]
Error code: auth/...
Error message: ...
```

